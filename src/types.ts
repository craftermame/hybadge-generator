/** 名札に印刷する内容（CSV の1行分） */
export interface BadgeData {
  /** 名札記載名（例: ひらがなの苗字） */
  name: string
  affiliation: string
  /** 雇用区分（例: パートタイム / フルタイム）。空なら印刷しない */
  employment: string
}

/** CSV マスタの1人分 + 今回参加するかどうか */
export interface Attendee extends BadgeData {
  participating: boolean
}

/** 所属名 → ロゴ画像 (PNG の dataURL) */
export type LogoMap = Record<string, string>

export interface Settings {
  /** 雇用区分を名札に印刷するか */
  printEmployment: boolean
  /** コメント欄の見出し（質問文） */
  commentLabel: string
}
