import type { Attendee, MasterRow } from '@/types'

const keyOf = (a: MasterRow) => `${a.affiliation}\t${a.name}`

/**
 * CSV（マスタ）を読み直したときに、前回の参加チェックを引き継ぐ。
 * 所属 + 名札記載名 で照合し、同じ組み合わせが複数いる場合は出現順に対応させる。
 * 前回いなかった人は「参加」で追加する。
 */
export function mergeParticipation(previous: Attendee[], rows: MasterRow[]): Attendee[] {
  const flags = new Map<string, boolean[]>()
  for (const a of previous) {
    const list = flags.get(keyOf(a))
    if (list) list.push(a.participating)
    else flags.set(keyOf(a), [a.participating])
  }
  return rows.map((row) => ({
    ...row,
    participating: flags.get(keyOf(row))?.shift() ?? true,
  }))
}
