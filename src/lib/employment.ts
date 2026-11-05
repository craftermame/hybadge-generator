export type Rgb = readonly [number, number, number]

/** 雇用区分チップの見た目（PDF と画面で共通） */
export interface ChipStyle {
  /** 背景色。null なら塗らずに枠線だけ描く */
  background: Rgb | null
  text: Rgb
}

const EMPLOYMENT_STYLES: Record<string, ChipStyle> = {
  // 緑背景・白文字
  フルタイム: { background: [22, 163, 74], text: [255, 255, 255] },
  // 薄い黄緑背景・緑文字
  パートタイム: { background: [220, 244, 190], text: [21, 128, 61] },
  // ごく薄い青背景・シアン文字
  インターン: { background: [236, 246, 255], text: [8, 145, 178] },
  // 淡い水色背景・青文字
  業務委託: { background: [207, 237, 252], text: [29, 78, 216] },
  // 薄灰色背景・黒寄りの灰色文字
  卒業メンバー: { background: [229, 231, 235], text: [55, 65, 81] },
}

/** 上記以外の値: 灰色の枠線・灰色文字 */
const OTHER_STYLE: ChipStyle = { background: null, text: [107, 114, 128] }

export function employmentStyle(employment: string): ChipStyle {
  return EMPLOYMENT_STYLES[employment.trim()] ?? OTHER_STYLE
}

export function rgbToCss([r, g, b]: Rgb): string {
  return `rgb(${r} ${g} ${b})`
}
