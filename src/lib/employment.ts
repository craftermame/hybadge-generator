export type Rgb = readonly [number, number, number]

/** 雇用区分ごとのラベル色（PDF と画面で共通） */
const EMPLOYMENT_COLORS: Record<string, Rgb> = {
  フルタイム: [37, 99, 235], // 青
  パートタイム: [234, 88, 12], // オレンジ
}
const OTHER_COLOR: Rgb = [107, 114, 128] // グレー

export function employmentColor(employment: string): Rgb {
  return EMPLOYMENT_COLORS[employment.trim()] ?? OTHER_COLOR
}

export function rgbToCss([r, g, b]: Rgb): string {
  return `rgb(${r} ${g} ${b})`
}
