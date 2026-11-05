import Papa from 'papaparse'
import type { MasterRow } from '@/types'

const NAME_HEADERS = ['名札記載名', '名前', '氏名', 'name']
const AFFILIATION_HEADERS = ['所属', '会社', '会社名', 'affiliation', 'company', 'organization']
// 「雇用区分」は旧見出し（以前の CSV もそのまま読めるように残す）
const EMPLOYMENT_HEADERS = ['雇用形態', '雇用区分', 'employment']
const TABLEWARE_HEADERS = ['食器記載名', 'tableware']

export class CsvError extends Error {}

export interface CsvParseResult {
  rows: MasterRow[]
  /** スキップした行などの注意事項 */
  warnings: string[]
}

/** UTF-8 として読めなければ Shift_JIS（Excel 出力）として読む。BOM は除去される */
export function decodeCsv(buffer: ArrayBuffer | Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('shift_jis').decode(buffer)
  }
}

function findHeader(fields: string[], candidates: string[]): string | undefined {
  return fields.find((f) => candidates.includes(f.toLowerCase()))
}

export function parseCsv(text: string): CsvParseResult {
  const result = Papa.parse<Record<string, string | undefined>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.replace(/^﻿/, '').trim(),
  })

  const fields = result.meta.fields ?? []
  const nameKey = findHeader(fields, NAME_HEADERS)
  if (!nameKey) {
    throw new CsvError(
      `「名札記載名」の列が見つかりません。1行目に「名札記載名,食器記載名,所属,雇用形態」の見出しを入れてください（見つかった見出し: ${fields.join(', ') || 'なし'}）`,
    )
  }
  const affiliationKey = findHeader(fields, AFFILIATION_HEADERS)
  const employmentKey = findHeader(fields, EMPLOYMENT_HEADERS)
  const tablewareKey = findHeader(fields, TABLEWARE_HEADERS)

  const warnings: string[] = []
  if (!affiliationKey) warnings.push('「所属」の列が見つからないため、所属は空欄になります')
  if (!employmentKey) warnings.push('「雇用形態」の列が見つからないため、雇用形態は空欄になります')
  if (!tablewareKey) warnings.push('「食器記載名」の列が見つからないため、食器用名札は作れません')

  const get = (row: Record<string, string | undefined>, key: string | undefined) =>
    key ? (row[key]?.trim() ?? '') : ''

  const rows: MasterRow[] = []
  result.data.forEach((row, i) => {
    const name = get(row, nameKey)
    if (!name) {
      // 見出し行が1行目なので、データの i 番目はファイルの i+2 行目（空行スキップ時は目安）
      warnings.push(`${i + 2}行目付近: 名札記載名が空のためスキップしました`)
      return
    }
    rows.push({
      name,
      tablewareName: get(row, tablewareKey),
      affiliation: get(row, affiliationKey),
      employment: get(row, employmentKey),
    })
  })

  return { rows, warnings }
}

export async function readCsvFile(file: File): Promise<CsvParseResult> {
  return parseCsv(decodeCsv(await file.arrayBuffer()))
}
