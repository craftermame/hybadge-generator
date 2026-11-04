import { jsPDF } from 'jspdf'
import { cutLines, slotOf, type GridSpec, type Slot } from '../layout'

export const FONT_FAMILY = 'BIZUDPGothic'
const FONT_FILES = {
  normal: 'BIZUDPGothic-Regular.ttf',
  bold: 'BIZUDPGothic-Bold.ttf',
} as const

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

/** 日本語フォントを登録済みの A4 ドキュメントを作る。1ページ目の向きは firstSpec に合わせる */
export async function createDocument(firstSpec: GridSpec, fontBaseUrl: string): Promise<jsPDF> {
  const fonts = await loadFonts(fontBaseUrl)
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: firstSpec.page.orientation })
  doc.addFileToVFS(FONT_FILES.normal, fonts.normal)
  doc.addFont(FONT_FILES.normal, FONT_FAMILY, 'normal')
  doc.addFileToVFS(FONT_FILES.bold, fonts.bold)
  doc.addFont(FONT_FILES.bold, FONT_FAMILY, 'bold')
  return doc
}

/** 最大幅に収まるフォントサイズ(pt)を設定して返す */
export function fitFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize: number,
) {
  doc.setFontSize(maxSize)
  const width = doc.getTextWidth(text)
  const size = width > maxWidth ? Math.max(minSize, (maxSize * maxWidth) / width) : maxSize
  doc.setFontSize(size)
  return size
}

function drawCutLines(doc: jsPDF, spec: GridSpec) {
  doc.setDrawColor(200)
  doc.setLineWidth(0.2)
  for (const l of cutLines(spec)) doc.line(l.x1, l.y1, l.x2, l.y2)
}

/**
 * total 個のマスを順に描く。ページ送り（用紙の向きは spec に合わせる）とカットラインはここで行う。
 * startOnNewPage が false なら、ドキュメントの現在のページ（白紙）から描き始める。
 */
export function drawGrid(
  doc: jsPDF,
  spec: GridSpec,
  total: number,
  drawCell: (index: number, slot: Slot) => void,
  startOnNewPage: boolean,
) {
  let currentPage = -1
  for (let i = 0; i < total; i++) {
    const slot = slotOf(spec, i)
    if (slot.page !== currentPage) {
      if (currentPage >= 0) drawCutLines(doc, spec)
      if (currentPage >= 0 || startOnNewPage) doc.addPage('a4', spec.page.orientation)
      currentPage = slot.page
    }
    drawCell(i, slot)
  }
  if (total > 0) drawCutLines(doc, spec)
}
