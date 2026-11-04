import { describe, expect, it } from 'vitest'
import {
  BADGE_GRID,
  TABLEWARE_GRID,
  blankCount,
  cellsPerPage,
  cutLines,
  pageCount,
  slotOf,
} from '../layout'

describe('名札 (BADGE_GRID)', () => {
  it('A4 縦に 2列×4行 = 8枚', () => {
    expect(cellsPerPage(BADGE_GRID)).toBe(8)
  })

  it('用紙の左上から 2列×4行で並ぶ', () => {
    expect(slotOf(BADGE_GRID, 0)).toEqual({ page: 0, x: 0, y: 0 })
    expect(slotOf(BADGE_GRID, 1)).toEqual({ page: 0, x: 100, y: 0 })
    expect(slotOf(BADGE_GRID, 2)).toEqual({ page: 0, x: 0, y: 70 })
    expect(slotOf(BADGE_GRID, 7)).toEqual({ page: 0, x: 100, y: 210 })
    expect(slotOf(BADGE_GRID, 8)).toEqual({ page: 1, x: 0, y: 0 })
  })

  it('全マスが用紙内に収まる', () => {
    for (let i = 0; i < 8; i++) {
      const s = slotOf(BADGE_GRID, i)
      expect(s.x + BADGE_GRID.cell.width).toBeLessThanOrEqual(BADGE_GRID.page.width)
      expect(s.y + BADGE_GRID.cell.height).toBeLessThanOrEqual(BADGE_GRID.page.height)
    }
  })

  it('ページ数と余りマス', () => {
    expect(pageCount(BADGE_GRID, 0)).toBe(0)
    expect(pageCount(BADGE_GRID, 8)).toBe(1)
    expect(pageCount(BADGE_GRID, 9)).toBe(2)
    expect(blankCount(BADGE_GRID, 0)).toBe(0)
    expect(blankCount(BADGE_GRID, 1)).toBe(7)
    expect(blankCount(BADGE_GRID, 8)).toBe(0)
    expect(blankCount(BADGE_GRID, 10)).toBe(6)
  })

  it('カットラインは用紙の端と重なる線を除いて縦2本・横4本', () => {
    const lines = cutLines(BADGE_GRID)
    expect(lines.filter((l) => l.x1 === l.x2).map((l) => l.x1)).toEqual([100, 200])
    expect(lines.filter((l) => l.y1 === l.y2).map((l) => l.y1)).toEqual([70, 140, 210, 280])
  })
})

describe('食器用名札 (TABLEWARE_GRID)', () => {
  it('A4 横に よこ4×たて8 = 32枚、余りなし', () => {
    expect(cellsPerPage(TABLEWARE_GRID)).toBe(32)
    expect(TABLEWARE_GRID.cell.width * 4).toBeCloseTo(297)
    expect(TABLEWARE_GRID.cell.height * 8).toBeCloseTo(210)
  })

  it('左上から下へ並び、9枚目で次の列', () => {
    expect(slotOf(TABLEWARE_GRID, 0)).toEqual({ page: 0, x: 0, y: 0 })
    expect(slotOf(TABLEWARE_GRID, 1)).toEqual({ page: 0, x: 0, y: 26.25 })
    expect(slotOf(TABLEWARE_GRID, 7)).toEqual({ page: 0, x: 0, y: 183.75 })
    expect(slotOf(TABLEWARE_GRID, 8)).toEqual({ page: 0, x: 74.25, y: 0 })
    expect(slotOf(TABLEWARE_GRID, 31)).toEqual({ page: 0, x: 222.75, y: 183.75 })
    expect(slotOf(TABLEWARE_GRID, 32)).toEqual({ page: 1, x: 0, y: 0 })
  })

  it('用紙を割り切るので、カットラインは内側の縦3本・横7本だけ', () => {
    const lines = cutLines(TABLEWARE_GRID)
    expect(lines.filter((l) => l.x1 === l.x2)).toHaveLength(3)
    expect(lines.filter((l) => l.y1 === l.y2)).toHaveLength(7)
  })
})
