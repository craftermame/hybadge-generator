/** CSV マスタの1行分 */
export interface MasterRow {
  /** 名札記載名（例: ひらがなの苗字） */
  name: string
  /** 食器記載名（例: 漢字のフルネーム）。空なら食器用名札を作らない */
  tablewareName: string
  affiliation: string
  /** 雇用区分（例: パートタイム / フルタイム / 卒業メンバー）。空なら印刷しない */
  employment: string
}

/** CSV マスタの1人分 + 今回参加するかどうか */
export interface Attendee extends MasterRow {
  participating: boolean
}

/** 所属名 → ロゴ画像 (PNG の dataURL) */
export type LogoMap = Record<string, string>

export interface Settings {
  /** 雇用区分を名札に印刷するか */
  printEmployment: boolean
  /** コメント欄の見出し（質問文） */
  commentLabel: string
  /** 食器用名札を1人あたり何枚作るか（0 = 作らない） */
  tablewareCopies: number
}
