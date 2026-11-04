import { computed } from 'vue'
import type { Attendee, LogoMap, MasterRow, Settings } from '@/types'
import { mergeParticipation } from '@/lib/attendees'
import { useLocalStorage } from './useLocalStorage'

const DEFAULT_SETTINGS: Settings = {
  printEmployment: true,
  commentLabel: 'ひとこと',
  tablewareCopies: 1,
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const str = (v: unknown) => (typeof v === 'string' ? v : '')

function normalizeAttendees(v: unknown): Attendee[] | undefined {
  if (!Array.isArray(v)) return undefined
  return v.filter(isObject).flatMap((a) =>
    typeof a.name === 'string' && a.name
      ? [
          {
            name: a.name,
            tablewareName: str(a.tablewareName),
            affiliation: str(a.affiliation),
            employment: str(a.employment),
            participating: typeof a.participating === 'boolean' ? a.participating : true,
          },
        ]
      : [],
  )
}

function normalizeLogos(v: unknown): LogoMap | undefined {
  if (!isObject(v)) return undefined
  return Object.fromEntries(
    Object.entries(v).filter((e): e is [string, string] => typeof e[1] === 'string'),
  )
}

/** 食器用名札の枚数を 0〜99 の整数にそろえる（0 = 作らない） */
export function clampCopies(n: unknown): number {
  const value = typeof n === 'number' && Number.isFinite(n) ? Math.floor(n) : 0
  return Math.min(99, Math.max(0, value))
}

function normalizeSettings(v: unknown): Settings | undefined {
  if (!isObject(v)) return undefined
  return {
    printEmployment:
      typeof v.printEmployment === 'boolean' ? v.printEmployment : DEFAULT_SETTINGS.printEmployment,
    commentLabel:
      typeof v.commentLabel === 'string' ? v.commentLabel : DEFAULT_SETTINGS.commentLabel,
    tablewareCopies: clampCopies(v.tablewareCopies ?? DEFAULT_SETTINGS.tablewareCopies),
  }
}

function createStore() {
  // CSV マスタ全員分 + 参加チェック（名札・食器用名札で共通）
  const { state: attendees, error: attendeesError } = useLocalStorage<Attendee[]>(
    'hybadge:attendees',
    [],
    normalizeAttendees,
  )
  // ロゴは所属名をキーに保持するので、CSV を読み直しても使い回せる
  const { state: logos, error: logosError } = useLocalStorage<LogoMap>(
    'hybadge:logos',
    {},
    normalizeLogos,
  )
  const { state: settings, error: settingsError } = useLocalStorage<Settings>(
    'hybadge:settings',
    { ...DEFAULT_SETTINGS },
    normalizeSettings,
  )

  const participants = computed(() => attendees.value.filter((a) => a.participating))

  const affiliations = computed(() => [
    ...new Set(attendees.value.map((a) => a.affiliation).filter(Boolean)),
  ])

  const storageError = computed(
    () => attendeesError.value ?? logosError.value ?? settingsError.value,
  )

  /** CSV を読み込む。前回の参加チェックは引き継ぐ */
  function importRows(rows: MasterRow[]) {
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

let store: ReturnType<typeof createStore> | undefined

/** アプリ全体で1つの状態を共有する（ページを移動しても同じデータを使う） */
export function useAppStore() {
  store ??= createStore()
  return store
}
