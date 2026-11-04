import { describe, expect, it } from 'vitest'
import { mergeParticipation } from '../attendees'
import type { Attendee, BadgeData } from '@/types'

const row = (name: string, affiliation = 'A社', employment = ''): BadgeData => ({
  name,
  affiliation,
  employment,
})
const attendee = (r: BadgeData, participating: boolean): Attendee => ({ ...r, participating })

describe('mergeParticipation', () => {
  it('初回はすべて参加', () => {
    expect(mergeParticipation([], [row('やまだ')])).toEqual([attendee(row('やまだ'), true)])
  })

  it('前回の参加チェックを所属+名前で引き継ぎ、新しい人は参加で追加', () => {
    const prev = [attendee(row('やまだ'), false), attendee(row('さとう'), true)]
    const next = mergeParticipation(prev, [
      row('さとう'),
      row('やまだ', 'A社', 'フルタイム'),
      row('すずき'),
    ])
    expect(next.map((a) => [a.name, a.participating])).toEqual([
      ['さとう', true],
      ['やまだ', false],
      ['すずき', true],
    ])
    // 雇用区分など他の値は新しい CSV のものになる
    expect(next[1]!.employment).toBe('フルタイム')
  })

  it('所属が違えば別人', () => {
    const prev = [attendee(row('やまだ', 'A社'), false)]
    expect(mergeParticipation(prev, [row('やまだ', 'B社')])[0]!.participating).toBe(true)
  })

  it('同じ所属+名前が複数いる場合は出現順に対応させる', () => {
    const prev = [attendee(row('たなか'), true), attendee(row('たなか'), false)]
    const next = mergeParticipation(prev, [row('たなか'), row('たなか'), row('たなか')])
    expect(next.map((a) => a.participating)).toEqual([true, false, true])
  })
})
