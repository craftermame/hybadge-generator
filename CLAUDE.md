# hybadge-generator

イベント用の名札を A4 に面付けした PDF を生成する Web ツール。印刷後にハサミで切って使う。
GitHub Pages で公開する静的 SPA（サーバーなし）。画面は1つ（`src/App.vue`）。

出力する PDF は1つで、次の順にページが並ぶ（`src/lib/pdf/index.ts` の `generatePdf`）:
1. 名札（首掛けストラップのケース用、A4 縦）
2. 食器用名札（パーティーで食器につける、A4 横）

## 名札の仕様
- 名札サイズ: 横 100×70mm。A4 縦 (210×297mm) に 2列×4行 = 8枚/ページ
  - 用紙の左上に寄せて隙間なしで並べる（左辺・上辺は切らなくて済むように）。右 10mm / 下 17mm が余り
  - 薄いグレーのカットラインを引く（用紙の端と重なる線は引かない）
  - 注意: プリンタの印刷できない余白（数mm）に名札の端がかかる。名札内側の余白 5mm で吸収している
- 名札の内容（`src/lib/pdf/badge.ts`）:
  - 左上: 企業ロゴ（小さめ）。ロゴ未登録の所属は所属名をテキストで表示する
  - 右上: 雇用形態チップ（背景色＋文字色。`src/lib/employment.ts`）。値が空、または UI で「印刷しない」にした場合は描かない
    - フルタイム=緑背景・白文字 / パートタイム=薄い黄緑背景・緑文字 / インターン=ごく薄い青背景・シアン文字 / 業務委託=淡い水色背景・青文字 / 卒業メンバー=薄灰色背景・濃い灰色文字 / その他=灰色の枠線・灰色文字
  - 中央: 名札記載名（ひらがなの苗字を想定）。できるだけ大きく、幅に合わせて縮小
  - 下段: 一言コメント欄（空欄。当日手書き）。見出しの質問文は UI で入力
  - 最終ページの余り枠は手書き用の名札（「なまえ」記入欄＋コメント欄）で埋める

## 食器用名札の仕様
- A4 横 (297×210mm) を よこ4×たて8 = 32マスに割る（74.25×26.25mm、余白なし）。左上から下へ埋め、列が埋まったら右の列へ
- マスの中央に食器記載名（漢字）を太字で入れる。1人あたりの枚数は UI で指定（0〜99。0 なら食器用名札のページを作らない）し、同じ人の分を続けて並べる
- 食器記載名が空の参加者は作らない。余りマスは空欄

## 共通仕様
- 入力: ユーザーが選択した CSV（見出し `名札記載名,食器記載名,所属,雇用形態`。旧見出し `名前`・`雇用区分` や英語見出しも許容）
  - 文字コードは UTF-8 / Shift_JIS（Excel 出力）の両方に対応する
  - CSV は全員分のマスタ。UI の参加者一覧のチェックボックスで今回参加する人を選び、参加者だけを印刷する
  - CSV を読み直したときは、所属+名札記載名で照合して前回の参加チェックを引き継ぐ（`src/lib/attendees.ts`）
- ロゴ: UI で所属名ごとに画像をアップロードし、縮小した dataURL で保持する
- 永続化: CSV の内容（参加チェック込み）・ロゴ・設定（雇用形態の印刷有無・質問文・食器の枚数）は localStorage に保存する（容量 約5MB。保存失敗時は UI で警告）
  - 読み込み時は normalize で現在の形にそろえる。項目を追加しても既存データを捨てないこと

## 技術スタック
- Vue 3 (`<script setup lang="ts">`) + Vite + TypeScript、npm
- PDF: jsPDF（単位は mm）。日本語フォントは `public/fonts/` の BIZ UDPGothic TTF（OFL）を PDF 生成時に fetch して埋め込む（jsPDF が使用文字のみ埋め込むため PDF は数百KB 程度）
- CSV: PapaParse
- Lint/Format: oxlint + ESLint + Prettier
- テスト: Vitest（純粋関数のロジックを対象）
- デプロイ: main への push で GitHub Actions（`.github/workflows/deploy.yml`）がテスト・ビルドして GitHub Pages に公開する
  - 公開 URL: https://craftermame.github.io/hybadge-generator/ （`vite.config.ts` の `base` は `/hybadge-generator/`）

## コマンド
- `npm run dev` 開発サーバー
- `npm run build` 型チェック + ビルド
- `npm run type-check` / `npm run lint` / `npm run format`
- `npm test` テスト（`npm run test:watch` で監視モード）

## 設計方針
- `src/lib/` はフレームワーク非依存の純粋なロジック（csv / layout / pdf / image / employment）。Vue に依存させない
- PDF 生成は `src/lib/pdf/` に閉じ込める（`index.ts` = 1つの PDF にまとめる入口、`common.ts` = フォント・ページ送り（向きの切り替え込み）・カットライン、`badge.ts` / `tableware.ts` = 各名札の描画）
- jsPDF は大きいので、`src/lib/pdf` は PDF 出力ボタンを押したときに動的 import する
- 面付けの座標計算は `src/lib/layout.ts` の `GridSpec`（用紙・マス・行列数）を受け取る純粋関数にし、テストを書く
- 画面の部品は `src/components/`。状態は `src/composables/useAppStore.ts`（シングルトン）
- 状態は `src/composables/` に置き、localStorage との同期もそこで行う
- 公開アセットのパスは `import.meta.env.BASE_URL` を前置する（GitHub Pages のサブパス対策）
- 個人情報（実際の参加者 CSV）はリポジトリにコミットしない。サンプルは `samples/` のダミーデータのみ

## 規約
- UI テキスト・コメントは日本語で OK
- コミットや push はユーザーの指示があってから行う
