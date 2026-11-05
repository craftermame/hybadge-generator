import type { jsPDF } from 'jspdf'
import type { LogoMap, MasterRow } from '@/types'
import { employmentStyle } from '../employment'
import { BADGE_GRID, blankCount } from '../layout'
import { FONT_FAMILY, drawGrid, fitFontSize } from './common'

const BADGE = BADGE_GRID.cell

/** 名札内のレイアウト（名札左上からの相対位置, mm） */
const PADDING = 5
const INNER_WIDTH = BADGE.width - PADDING * 2
/** 上段（ロゴ・雇用形態）の縦位置 */
const HEADER = { top: PADDING, height: 11 }
const HEADER_CENTER_Y = HEADER.top + HEADER.height / 2
/** ロゴは左上に小さく */
const LOGO = { maxWidth: 40, maxHeight: HEADER.height }
/** ロゴ未登録時の所属名テキスト */
const AFFILIATION_TEXT = { maxWidth: 55, maxSize: 10, minSize: 6 }
/** 雇用形態は右上に色付きのチップ（背景色＋文字色）で表示 */
const EMPLOYMENT = { fontSize: 10, paddingX: 2.5, height: 6, lineWidth: 0.4 }
const NAME = { centerY: 32, maxSize: 48, minSize: 16, maxWidth: INNER_WIDTH - 4 }
const COMMENT_BOX = { top: 48, height: BADGE.height - PADDING - 48, radius: 2 }
/** 手書き用名札の名前記入欄 */
const BLANK_NAME = { labelY: 18, lineY: 43, labelSize: 8 }
/** コメント欄の見出し（質問文） */
const COMMENT_LABEL = { maxSize: 8, minSize: 5, maxWidth: INNER_WIDTH - 4 }

export interface BadgePdfOptions {
  /** 雇用形態を印刷するか */
  printEmployment: boolean
  /** コメント欄の見出し（質問文）。空なら描かない */
  commentLabel: string
}

function drawBadge(
  doc: jsPDF,
  badge: MasterRow,
  x: number,
  y: number,
  logos: LogoMap,
  logoAliases: Map<string, string>,
  options: BadgePdfOptions,
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

  // 右上: 雇用形態チップ（雇用形態ごとに背景色と文字色を変える。未定義の値は灰色の枠線）
  if (options.printEmployment && badge.employment) {
    const style = employmentStyle(badge.employment)
    doc.setFont(FONT_FAMILY, 'bold')
    doc.setFontSize(EMPLOYMENT.fontSize)
    const w = doc.getTextWidth(badge.employment) + EMPLOYMENT.paddingX * 2
    const right = x + BADGE.width - PADDING
    const r = EMPLOYMENT.height / 2
    const top = y + HEADER_CENTER_Y - r
    if (style.background) {
      doc.setFillColor(...style.background)
      doc.roundedRect(right - w, top, w, EMPLOYMENT.height, r, r, 'F')
    } else {
      doc.setDrawColor(...style.text)
      doc.setLineWidth(EMPLOYMENT.lineWidth)
      doc.roundedRect(right - w, top, w, EMPLOYMENT.height, r, r, 'S')
    }
    doc.setTextColor(...style.text)
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
function drawBlankBadge(doc: jsPDF, x: number, y: number, options: BadgePdfOptions) {
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
function drawCommentBox(doc: jsPDF, x: number, y: number, options: BadgePdfOptions) {
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

/** 名札のページを描く。最終ページの余り枠は手書き用の名札で埋める */
export function drawBadgePages(
  doc: jsPDF,
  badges: MasterRow[],
  logos: LogoMap,
  options: BadgePdfOptions,
  startOnNewPage: boolean,
) {
  const logoAliases = new Map<string, string>()
  const total = badges.length + blankCount(BADGE_GRID, badges.length)
  drawGrid(
    doc,
    BADGE_GRID,
    total,
    (i, { x, y }) => {
      const badge = badges[i]
      if (badge) drawBadge(doc, badge, x, y, logos, logoAliases, options)
      else drawBlankBadge(doc, x, y, options)
    },
    startOnNewPage,
  )
}
