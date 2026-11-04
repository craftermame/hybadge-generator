import type { jsPDF } from 'jspdf'
import { TABLEWARE_GRID } from '../layout'
import { FONT_FAMILY, drawGrid, fitFontSize } from './common'

const CELL = TABLEWARE_GRID.cell
/** マス内の左右の余白（mm） */
const PADDING_X = 3
const NAME = { maxSize: 40, minSize: 8, maxWidth: CELL.width - PADDING_X * 2 }

/** 1人あたり copies 枚ずつ、同じ人の分を続けて並べる（0 なら作らない） */
export function expandCopies(names: string[], copies: number): string[] {
  const n = Math.max(0, Math.floor(copies))
  return names.flatMap((name) => Array<string>(n).fill(name))
}

/** 食器用名札のページを描く。A4 横を よこ4×たて8 のマスに分け、マスの中央に名前を入れる */
export function drawTablewarePages(doc: jsPDF, cells: string[], startOnNewPage: boolean) {
  drawGrid(
    doc,
    TABLEWARE_GRID,
    cells.length,
    (i, { x, y }) => {
      const name = cells[i]!
      doc.setFont(FONT_FAMILY, 'bold')
      doc.setTextColor(0)
      fitFontSize(doc, name, NAME.maxWidth, NAME.maxSize, NAME.minSize)
      doc.text(name, x + CELL.width / 2, y + CELL.height / 2, {
        align: 'center',
        baseline: 'middle',
      })
    },
    startOnNewPage,
  )
}
