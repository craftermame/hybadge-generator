import { describe, expect, it } from 'vitest'
import { BADGE, MARGIN, PAGE, blankCount, cutLines, pageCount, slotOf } from '../layout'

describe('layout', () => {
  it('名札全体は用紙の左上に寄せる', () => {
    expect(MARGIN).toEqual({ x: 0, y: 0 })
  })

  it('1ページ目は左上から 2列×4行で並ぶ', () => {
    expect(slotOf(0)).toEqual({ page: 0, x: 0, y: 0 })
    expect(slotOf(1)).toEqual({ page: 0, x: 100, y: 0 })
    expect(slotOf(2)).toEqual({ page: 0, x: 0, y: 70 })
    expect(slotOf(7)).toEqual({ page: 0, x: 100, y: 210 })
  })

  it('9枚目から2ページ目', () => {
    expect(slotOf(8)).toEqual({ page: 1, x: 0, y: 0 })
  })

  it('全名札が用紙内に収まる', () => {
    for (let i = 0; i < 8; i++) {
      const s = slotOf(i)
      expect(s.x + BADGE.width).toBeLessThanOrEqual(PAGE.width)
      expect(s.y + BADGE.height).toBeLessThanOrEqual(PAGE.height)
    }
  })

  it('ページ数', () => {
    expect(pageCount(0)).toBe(0)
    expect(pageCount(1)).toBe(1)
    expect(pageCount(8)).toBe(1)
    expect(pageCount(9)).toBe(2)
  })

  it('最終ページの余り枠の数', () => {
    expect(blankCount(0)).toBe(0)
    expect(blankCount(1)).toBe(7)
    expect(blankCount(8)).toBe(0)
    expect(blankCount(10)).toBe(6)
  })

  it('カットラインは用紙の端と重なる線を除いて縦2本・横4本', () => {
    const lines = cutLines()
    expect(lines.filter((l) => l.x1 === l.x2).map((l) => l.x1)).toEqual([100, 200])
    expect(lines.filter((l) => l.y1 === l.y2).map((l) => l.y1)).toEqual([70, 140, 210, 280])
  })
})
