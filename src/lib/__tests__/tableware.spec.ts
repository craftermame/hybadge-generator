import { describe, expect, it } from 'vitest'
import { expandCopies } from '../pdf/tableware'

describe('expandCopies', () => {
  it('1人あたり指定枚数ずつ、同じ人を続けて並べる', () => {
    expect(expandCopies(['山田', '佐藤'], 3)).toEqual([
      '山田',
      '山田',
      '山田',
      '佐藤',
      '佐藤',
      '佐藤',
    ])
  })

  it('0 枚なら作らない。枚数は整数に切り捨てる', () => {
    expect(expandCopies(['山田'], 0)).toEqual([])
    expect(expandCopies(['山田'], 2.7)).toEqual(['山田', '山田'])
  })
})
