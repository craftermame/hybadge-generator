import { jsPDF } from 'jspdf'
import type { BadgeData, LogoMap } from '@/types'
import { employmentColor } from './employment'
import { BADGE, blankCount, cutLines, slotOf } from './layout'

const FONT_FAMILY = 'BIZUDPGothic'
const FONT_FILES = {
  normal: 'BIZUDPGothic-Regular.ttf',
  bold: 'BIZUDPGothic-Bold.ttf',
} as const

/** 名札内のレイアウト（名札左上からの相対位置, mm） */
const PADDING = 5
const INNER_WIDTH = BADGE.width - PADDING * 2
/** 上段（ロゴ・雇用区分）の縦位置 */
const HEADER = { top: PADDING, height: 11 }
const HEADER_CENTER_Y = HEADER.top + HEADER.height / 2
/** ロゴは左上に小さく */
const LOGO = { maxWidth: 40, maxHeight: HEADER.height }
/** ロゴ未登録時の所属名テキスト */
const AFFILIATION_TEXT = { maxWidth: 55, maxSize: 10, minSize: 6 }
/** 雇用区分は右上に色付きのチップ（枠線＋文字色）で表示 */
const EMPLOYMENT = { fontSize: 10, paddingX: 2.5, height: 6, lineWidth: 0.4 }
const NAME = { centerY: 31, maxSize: 48, minSize: 16, maxWidth: INNER_WIDTH - 4 }
const COMMENT_BOX = { top: 46, height: BADGE.height - PADDING - 46, radius: 2 }
/** 手書き用名札の名前記入欄 */
const BLANK_NAME = { labelY: 18, lineY: 41, labelSize: 8 }
/** コメント欄の見出し（質問文） */
const COMMENT_LABEL = { maxSize: 8, minSize: 5, maxWidth: INNER_WIDTH - 4 }

export interface PdfOptions {
  /** フォントを置いているディレクトリの URL（末尾 / 付き） */
  fontBaseUrl: string
  /** 雇用区分を印刷するか */
  printEmployment: boolean
  /** コメント欄の見出し（質問文）。空なら描かない */
  commentLabel: string
}

type FontData = Record<keyof typeof FONT_FILES, string>
let fontCache: Promise<FontData> | null = null

function loadFonts(baseUrl: string): Promise<FontData> {
  fontCache ??= (async () => {
    const [normal, bold] = await Promise.all(
      [FONT_FILES.normal, FONT_FILES.bold].map(async (file) => {
        const res = await fetch(baseUrl + file)
        if (!res.ok) throw new Error(`フォントを読み込めませんでした: ${file}`)
        return arrayBufferToBase64(await res.arrayBuffer())
      }),
    )
    return { normal: normal!, bold: bold! }
  })().catch((e: unknown) => {
    fontCache = null // 失敗したら次回やり直せるようにする
    throw e
  })
  return fontCache
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** 最大幅に収まるフォントサイズ(pt)を設定して返す */
function fitFontSize(doc: jsPDF, text: string, maxWidth: number, maxSize: number, minSize: number) {
  doc.setFontSize(maxSize)
  const width = doc.getTextWidth(text)
  const size = width > maxWidth ? Math.max(minSize, (maxSize * maxWidth) / width) : maxSize
  doc.setFontSize(size)
  return size
}

function drawBadge(
  doc: jsPDF,
  badge: BadgeData,
  x: number,
  y: number,
  logos: LogoMap,
  logoAliases: Map<string, string>,
  options: PdfOptions,
) {
  // 左上: ロゴ（未登録なら所属名テキスト）
  const logo = logos[badge.affiliation]
  if (logo) {
    const props = doc.getImageProperties(logo)
    const scale = Math.min(LOGO.maxWidth / props.width, LOGO.maxHeight / props.height)
    const w = props.width * scale
    const h = props.height * scale
    let alias = logoAliases.get(badge.affiliation)
    if (!alias) {
      // 同じロゴを何度も埋め込まないよう alias で使い回す
      alias = `logo-${logoAliases.size}`
      logoAliases.set(badge.affiliation, alias)
    }
    doc.addImage(logo, 'PNG', x + PADDING, y + HEADER_CENTER_Y - h / 2, w, h, alias)
  } else if (badge.affiliation) {
    doc.setFont(FONT_FAMILY, 'bold')
    doc.setTextColor(60)
    fitFontSize(
      doc,
      badge.affiliation,
      AFFILIATION_TEXT.maxWidth,
      AFFILIATION_TEXT.maxSize,
      AFFILIATION_TEXT.minSize,
    )
    doc.text(badge.affiliation, x + PADDING, y + HEADER_CENTER_Y, { baseline: 'middle' })
  }

  // 右上: 雇用区分チップ（雇用区分ごとに枠線と文字の色を変える）
  if (options.printEmployment && badge.employment) {
    const color = employmentColor(badge.employment)
    doc.setFont(FONT_FAMILY, 'bold')
    doc.setFontSize(EMPLOYMENT.fontSize)
    const w = doc.getTextWidth(badge.employment) + EMPLOYMENT.paddingX * 2
    const right = x + BADGE.width - PADDING
    const r = EMPLOYMENT.height / 2
    doc.setDrawColor(...color)
    doc.setLineWidth(EMPLOYMENT.lineWidth)
    doc.roundedRect(right - w, y + HEADER_CENTER_Y - r, w, EMPLOYMENT.height, r, r, 'S')
    doc.setTextColor(...color)
    doc.text(badge.employment, right - w / 2, y + HEADER_CENTER_Y, {
      align: 'center',
      baseline: 'middle',
    })
  }

  // 中央: 名前
  const centerX = x + BADGE.width / 2
  doc.setFont(FONT_FAMILY, 'bold')
  doc.setTextColor(0)
  fitFontSize(doc, badge.name, NAME.maxWidth, NAME.maxSize, NAME.minSize)
  doc.text(badge.name, centerX, y + NAME.centerY, { align: 'center', baseline: 'middle' })

  drawCommentBox(doc, x, y, options)
}

/** 手書き用の名札（名前も手書き）。最終ページの余り枠に使う */
function drawBlankBadge(doc: jsPDF, x: number, y: number, options: PdfOptions) {
  doc.setFont(FONT_FAMILY, 'normal')
  doc.setFontSize(BLANK_NAME.labelSize)
  doc.setTextColor(90)
  doc.text('なまえ', x + PADDING + 2, y + BLANK_NAME.labelY, { baseline: 'top' })
  doc.setDrawColor(170)
  doc.setLineWidth(0.3)
  doc.line(x + PADDING, y + BLANK_NAME.lineY, x + BADGE.width - PADDING, y + BLANK_NAME.lineY)

  drawCommentBox(doc, x, y, options)
}

/** 下段: 一言コメント欄（当日手書き） */
function drawCommentBox(doc: jsPDF, x: number, y: number, options: PdfOptions) {
  doc.setDrawColor(170)
  doc.setLineWidth(0.3)
  doc.roundedRect(
    x + PADDING,
    y + COMMENT_BOX.top,
    INNER_WIDTH,
    COMMENT_BOX.height,
    COMMENT_BOX.radius,
    COMMENT_BOX.radius,
    'S',
  )
  const label = options.commentLabel.trim()
  if (label) {
    doc.setFont(FONT_FAMILY, 'normal')
    doc.setTextColor(90)
    fitFontSize(doc, label, COMMENT_LABEL.maxWidth, COMMENT_LABEL.maxSize, COMMENT_LABEL.minSize)
    doc.text(label, x + PADDING + 2, y + COMMENT_BOX.top + 1.5, { baseline: 'top' })
  }
}

function drawCutLines(doc: jsPDF) {
  doc.setDrawColor(200)
  doc.setLineWidth(0.2)
  for (const l of cutLines()) doc.line(l.x1, l.y1, l.x2, l.y2)
}

export async function generateBadgePdf(
  badges: BadgeData[],
  logos: LogoMap,
  options: PdfOptions,
): Promise<jsPDF> {
  if (badges.length === 0) throw new Error('参加者がいません')

  const fonts = await loadFonts(options.fontBaseUrl)
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  doc.addFileToVFS(FONT_FILES.normal, fonts.normal)
  doc.addFont(FONT_FILES.normal, FONT_FAMILY, 'normal')
  doc.addFileToVFS(FONT_FILES.bold, fonts.bold)
  doc.addFont(FONT_FILES.bold, FONT_FAMILY, 'bold')

  const logoAliases = new Map<string, string>()
  let currentPage = 0
  const total = badges.length + blankCount(badges.length)
  for (let i = 0; i < total; i++) {
    const slot = slotOf(i)
    if (slot.page !== currentPage) {
      drawCutLines(doc)
      doc.addPage()
      currentPage = slot.page
    }
    const badge = badges[i]
    if (badge) drawBadge(doc, badge, slot.x, slot.y, logos, logoAliases, options)
    else drawBlankBadge(doc, slot.x, slot.y, options)
  }
  drawCutLines(doc)

  return doc
}
