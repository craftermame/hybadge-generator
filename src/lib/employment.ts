export type Rgb = readonly [number, number, number]

/** 雇用区分ごとのチップの色（PDF と画面で共通） */
const EMPLOYMENT_COLORS: Record<string, Rgb> = {
  フルタイム: [37, 99, 235], // 青
  パートタイム: [234, 88, 12], // オレンジ
  卒業メンバー: [147, 51, 234], // 紫
}
const OTHER_COLOR: Rgb = [107, 114, 128] // グレー

export function employmentColor(employment: string): Rgb {
  return EMPLOYMENT_COLORS[employment.trim()] ?? OTHER_COLOR
}

export function rgbToCss([r, g, b]: Rgb): string {
  return `rgb(${r} ${g} ${b})`
}
