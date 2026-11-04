/**
 * 用紙へのマス目の面付け計算（単位: mm）。
 * マスは隙間なく並べて用紙の左上に寄せる。左辺・上辺は用紙の端がそのままマスの端になるので、
 * ハサミで切るのは右と下の余りだけで済む。
 */

export interface Size {
  width: number
  height: number
}

export interface GridSpec {
  page: Size & { orientation: 'portrait' | 'landscape' }
  cell: Size
  cols: number
  rows: number
  /** マスを埋める向き。row = 左から右へ（行ごと）、column = 上から下へ（列ごと） */
  fill: 'row' | 'column'
}

/** 名札: A4 縦に 100×70mm を 2列×4行。右 10mm / 下 17mm が余り */
export const BADGE_GRID: GridSpec = {
  page: { width: 210, height: 297, orientation: 'portrait' },
  cell: { width: 100, height: 70 },
  cols: 2,
  rows: 4,
  fill: 'row',
}

/** 食器用名札: A4 横をよこ4×たて8 で割り切る（74.25×26.25mm、余りなし）。左上から下へ埋める */
export const TABLEWARE_GRID: GridSpec = {
  page: { width: 297, height: 210, orientation: 'landscape' },
  cell: { width: 297 / 4, height: 210 / 8 },
  cols: 4,
  rows: 8,
  fill: 'column',
}

export interface Slot {
  /** 0 始まりのページ番号 */
  page: number
  /** マス左上の座標 */
  x: number
  y: number
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

export const cellsPerPage = (spec: GridSpec) => spec.cols * spec.rows

/** n 番目（0 始まり）のマスの位置 */
export function slotOf(spec: GridSpec, index: number): Slot {
  const perPage = cellsPerPage(spec)
  const inPage = index % perPage
  const [col, row] =
    spec.fill === 'row'
      ? [inPage % spec.cols, Math.floor(inPage / spec.cols)]
      : [Math.floor(inPage / spec.rows), inPage % spec.rows]
  return {
    page: Math.floor(index / perPage),
    x: col * spec.cell.width,
    y: row * spec.cell.height,
  }
}

export function pageCount(spec: GridSpec, count: number): number {
  return Math.ceil(count / cellsPerPage(spec))
}

/** 最終ページの余りマスの数 */
export function blankCount(spec: GridSpec, count: number): number {
  return pageCount(spec, count) * cellsPerPage(spec) - count
}

/** 浮動小数の誤差で用紙の端と判定し損ねないための許容差 */
const EPSILON = 1e-6

/**
 * カットライン。ハサミでまっすぐ切れるよう、マスの境界線を用紙の端から端まで引く。
 * 用紙の端と重なる線は不要なので引かない。
 */
export function cutLines(spec: GridSpec): Line[] {
  const { page, cell } = spec
  const lines: Line[] = []
  for (let c = 1; c <= spec.cols; c++) {
    const x = c * cell.width
    if (x < page.width - EPSILON) lines.push({ x1: x, y1: 0, x2: x, y2: page.height })
  }
  for (let r = 1; r <= spec.rows; r++) {
    const y = r * cell.height
    if (y < page.height - EPSILON) lines.push({ x1: 0, y1: y, x2: page.width, y2: y })
  }
  return lines
}
