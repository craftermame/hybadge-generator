/**
 * A4 縦への面付け計算（単位: mm）。
 * 100×70mm の名札を 2列×4行 = 8枚/ページ で隙間なく並べ、用紙の左上に寄せる。
 * 左辺・上辺は用紙の端がそのまま名札の端になるので、切るのは右と下の余り（10mm / 17mm）だけ。
 */

export const PAGE = { width: 210, height: 297 } as const
export const BADGE = { width: 100, height: 70 } as const
export const GRID = { cols: 2, rows: 4 } as const
export const BADGES_PER_PAGE = GRID.cols * GRID.rows

/** 名札全体の左上の位置（用紙の左上に寄せる） */
export const MARGIN = { x: 0, y: 0 } as const

export interface BadgeSlot {
  /** 0 始まりのページ番号 */
  page: number
  /** 名札左上の座標 */
  x: number
  y: number
}

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** n 枚目（0 始まり）の名札の配置位置 */
export function slotOf(index: number): BadgeSlot {
  const page = Math.floor(index / BADGES_PER_PAGE)
  const inPage = index % BADGES_PER_PAGE
  const col = inPage % GRID.cols
  const row = Math.floor(inPage / GRID.cols)
  return {
    page,
    x: MARGIN.x + col * BADGE.width,
    y: MARGIN.y + row * BADGE.height,
  }
}

export function pageCount(badgeCount: number): number {
  return Math.ceil(badgeCount / BADGES_PER_PAGE)
}

/** 最終ページの余り枠の数（手書き用の名札で埋める） */
export function blankCount(badgeCount: number): number {
  return pageCount(badgeCount) * BADGES_PER_PAGE - badgeCount
}

/**
 * カットライン。ハサミでまっすぐ切れるよう、名札の境界線を用紙の端から端まで引く。
 * 用紙の端と重なる線は不要なので引かない。
 */
export function cutLines(): Line[] {
  const lines: Line[] = []
  for (let c = 0; c <= GRID.cols; c++) {
    const x = MARGIN.x + c * BADGE.width
    if (x > 0 && x < PAGE.width) lines.push({ x1: x, y1: 0, x2: x, y2: PAGE.height })
  }
  for (let r = 0; r <= GRID.rows; r++) {
    const y = MARGIN.y + r * BADGE.height
    if (y > 0 && y < PAGE.height) lines.push({ x1: 0, y1: y, x2: PAGE.width, y2: y })
  }
  return lines
}
