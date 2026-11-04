import { computed } from 'vue'
import type { Attendee, BadgeData, LogoMap, Settings } from '@/types'
import { mergeParticipation } from '@/lib/attendees'
import { useLocalStorage } from './useLocalStorage'

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const isAttendees = (v: unknown): v is Attendee[] =>
  Array.isArray(v) &&
  v.every(
    (a) =>
      isObject(a) &&
      typeof a.name === 'string' &&
      typeof a.affiliation === 'string' &&
      typeof a.employment === 'string' &&
      typeof a.participating === 'boolean',
  )

const isLogoMap = (v: unknown): v is LogoMap =>
  isObject(v) && Object.values(v).every((s) => typeof s === 'string')

const isSettings = (v: unknown): v is Settings =>
  isObject(v) && typeof v.printEmployment === 'boolean' && typeof v.commentLabel === 'string'

export function useBadgeStore() {
  // CSV マスタ全員分 + 参加チェック
  const { state: attendees, error: attendeesError } = useLocalStorage<Attendee[]>(
    'hybadge:attendees',
    [],
    isAttendees,
  )
  // ロゴは所属名をキーに保持するので、CSV を読み直しても使い回せる
  const { state: logos, error: logosError } = useLocalStorage<LogoMap>(
    'hybadge:logos',
    {},
    isLogoMap,
  )
  const { state: settings, error: settingsError } = useLocalStorage<Settings>(
    'hybadge:settings',
    { printEmployment: true, commentLabel: 'ひとこと' },
    isSettings,
  )

  const participants = computed(() => attendees.value.filter((a) => a.participating))

  const affiliations = computed(() => [
    ...new Set(attendees.value.map((a) => a.affiliation).filter(Boolean)),
  ])

  const storageError = computed(
    () => attendeesError.value ?? logosError.value ?? settingsError.value,
  )

  /** CSV を読み込む。前回の参加チェックは引き継ぐ */
  function importRows(rows: BadgeData[]) {
    attendees.value = mergeParticipation(attendees.value, rows)
  }

  function setAllParticipating(value: boolean) {
    attendees.value = attendees.value.map((a) => ({ ...a, participating: value }))
  }

  function setLogo(affiliation: string, dataUrl: string) {
    logos.value = { ...logos.value, [affiliation]: dataUrl }
  }

  function removeLogo(affiliation: string) {
    const next = { ...logos.value }
    delete next[affiliation]
    logos.value = next
  }

  function clearAll() {
    attendees.value = []
    logos.value = {}
  }

  return {
    attendees,
    participants,
    logos,
    settings,
    affiliations,
    storageError,
    importRows,
    setAllParticipating,
    setLogo,
    removeLogo,
    clearAll,
  }
}
