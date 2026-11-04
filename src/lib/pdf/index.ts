import type { jsPDF } from 'jspdf'
import type { LogoMap, MasterRow } from '@/types'
import { BADGE_GRID, TABLEWARE_GRID } from '../layout'
import { drawBadgePages, type BadgePdfOptions } from './badge'
import { createDocument } from './common'
import { drawTablewarePages, expandCopies } from './tableware'

export interface PdfInput {
  /** フォントを置いているディレクトリの URL（末尾 / 付き） */
  fontBaseUrl: string
  /** 名札にする参加者 */
  badges: MasterRow[]
  logos: LogoMap
  badgeOptions: BadgePdfOptions
  /** 食器用名札にする名前（食器記載名） */
  tablewareNames: string[]
  /** 食器用名札の1人あたりの枚数（0 なら作らない） */
  tablewareCopies: number
}

/**
 * 1つの PDF を作る。名札のページ（A4 縦）のあとに食器用名札のページ（A4 横）が続く。
 */
export async function generatePdf(input: PdfInput): Promise<jsPDF> {
  const tablewareCells = expandCopies(input.tablewareNames, input.tablewareCopies)
  const hasBadges = input.badges.length > 0
  if (!hasBadges && tablewareCells.length === 0) throw new Error('印刷する名札がありません')

  const doc = await createDocument(hasBadges ? BADGE_GRID : TABLEWARE_GRID, input.fontBaseUrl)
  if (hasBadges) drawBadgePages(doc, input.badges, input.logos, input.badgeOptions, false)
  if (tablewareCells.length > 0) drawTablewarePages(doc, tablewareCells, hasBadges)
  return doc
}
