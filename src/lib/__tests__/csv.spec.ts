import { describe, expect, it } from 'vitest'
import { CsvError, decodeCsv, parseCsv } from '../csv'

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/../g)!.map((h) => parseInt(h, 16)))
}

describe('decodeCsv', () => {
  it('UTF-8（BOM付き）を読める', () => {
    const bytes = new TextEncoder().encode('﻿名前,所属\n山田,テスト')
    expect(decodeCsv(bytes)).toBe('名前,所属\n山田,テスト')
  })

  it('Shift_JIS を読める', () => {
    // "名前,所属\r\n山田 太郎,テスト商事\r\n" を Shift_JIS にしたもの
    const sjis = hexToBytes('96bc914f2c8f8a91ae0d0a8e5293632091be98592c8365835883678fa48e960d0a')
    expect(decodeCsv(sjis)).toBe('名前,所属\r\n山田 太郎,テスト商事\r\n')
  })
})

describe('parseCsv', () => {
  it('名札記載名・食器記載名・所属・雇用形態を読み込む', () => {
    const { rows, warnings } = parseCsv(
      '名札記載名,食器記載名,所属,雇用形態\nやまだ,山田 太郎,テスト商事,フルタイム\nさとう,,,卒業メンバー\n',
    )
    expect(rows).toEqual([
      {
        name: 'やまだ',
        tablewareName: '山田 太郎',
        affiliation: 'テスト商事',
        employment: 'フルタイム',
      },
      { name: 'さとう', tablewareName: '', affiliation: '', employment: '卒業メンバー' },
    ])
    expect(warnings).toEqual([])
  })

  it('旧見出し「名前」「雇用区分」や英語の見出しも許容し、前後の空白を除く', () => {
    const old = parseCsv('名前,所属,雇用区分\nやまだ,A社,パートタイム').rows[0]
    expect(old?.name).toBe('やまだ')
    expect(old?.employment).toBe('パートタイム')
    const { rows } = parseCsv(
      ' Name , Tableware , Affiliation , Employment \n John , John Smith , Example Inc. , Full-time ',
    )
    expect(rows).toEqual([
      {
        name: 'John',
        tablewareName: 'John Smith',
        affiliation: 'Example Inc.',
        employment: 'Full-time',
      },
    ])
  })

  it('名札記載名が空の行はスキップして警告する', () => {
    const { rows, warnings } = parseCsv(
      '名札記載名,食器記載名,所属,雇用形態\n,山田,A社,\nやまだ,山田,A社,',
    )
    expect(rows).toHaveLength(1)
    expect(warnings).toHaveLength(1)
  })

  it('名札記載名の列がなければエラー', () => {
    expect(() => parseCsv('foo,bar\n1,2')).toThrow(CsvError)
  })

  it('食器記載名・所属・雇用形態の列がなければ警告して空欄にする', () => {
    const { rows, warnings } = parseCsv('名札記載名\nやまだ')
    expect(rows).toEqual([{ name: 'やまだ', tablewareName: '', affiliation: '', employment: '' }])
    expect(warnings).toHaveLength(3)
  })
})
