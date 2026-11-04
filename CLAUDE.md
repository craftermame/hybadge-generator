# hybadge-generator

イベント用の名札（首掛けストラップのケース用）を A4 に面付けした PDF を生成する Web ツール。
印刷後にハサミで切って使う。GitHub Pages で公開する静的 SPA（サーバーなし）。

## 仕様
- 名札サイズ: 横 100×70mm。A4 縦 (210×297mm) に 2列×4行 = 8枚/ページ
  - 用紙の左上に寄せて隙間なしで並べる（左辺・上辺は切らなくて済むように）。右 10mm / 下 17mm が余り
  - 薄いグレーのカットラインを引く（用紙の端と重なる線は引かない）
  - 注意: プリンタの印刷できない余白（数mm）に名札の端がかかる。名札内側の余白 5mm で吸収している
- 名札の内容（`src/lib/pdf.ts`）:
  - 左上: 企業ロゴ（小さめ）。ロゴ未登録の所属は所属名をテキストで表示する
  - 右上: 雇用区分ラベル（パートタイム / フルタイム）。値が空、または UI で「印刷しない」にした場合は描かない
  - 中央: 名札記載名（ひらがなの苗字を想定）。できるだけ大きく、幅に合わせて縮小
  - 下段: 一言コメント欄（空欄。当日手書き）
- 入力: ユーザーが選択した CSV（見出し `名札記載名,所属,雇用区分`。旧見出し `名前` や英語見出しも許容）
  - 文字コードは UTF-8 / Shift_JIS（Excel 出力）の両方に対応する
  - CSV は全員分のマスタ。UI の参加者一覧のチェックボックスで今回参加する人を選び、参加者だけを印刷する
  - CSV を読み直したときは、所属+名札記載名で照合して前回の参加チェックを引き継ぐ（`src/lib/attendees.ts`）
- ロゴ: UI で所属名ごとに画像をアップロードし、縮小した dataURL で保持する
- 永続化: CSV の内容（参加チェック込み）・ロゴ・設定は localStorage に保存する（容量 約5MB。保存失敗時は UI で警告）

## 技術スタック
- Vue 3 (`<script setup lang="ts">`) + Vite + TypeScript、npm
- PDF: jsPDF（単位は mm）。日本語フォントは `public/fonts/` の BIZ UDPGothic TTF（OFL）を PDF 生成時に fetch して埋め込む（jsPDF が使用文字のみ埋め込むため PDF は数百KB 程度）
- CSV: PapaParse
- Lint/Format: oxlint + ESLint + Prettier
- テスト: Vitest（純粋関数のロジックを対象）
- デプロイ: GitHub Actions → GitHub Pages（`vite.config.ts` の `base` は `/hybadge-generator/`）

## コマンド
- `npm run dev` 開発サーバー
- `npm run build` 型チェック + ビルド
- `npm run type-check` / `npm run lint` / `npm run format`
- `npm test` テスト（`npm run test:watch` で監視モード）

## 設計方針
- `src/lib/` はフレームワーク非依存の純粋なロジック（csv / layout / pdf / image）。Vue に依存させない
- PDF 生成は `src/lib/pdf.ts` に閉じ込める（将来 pdf-lib 等へ差し替え可能にするため）
- 面付けの座標計算は `src/lib/layout.ts` の純粋関数にし、テストを書く
- 状態は `src/composables/` に置き、localStorage との同期もそこで行う
- 公開アセットのパスは `import.meta.env.BASE_URL` を前置する（GitHub Pages のサブパス対策）
- 個人情報（実際の参加者 CSV）はリポジトリにコミットしない。サンプルは `samples/` のダミーデータのみ

## 規約
- UI テキスト・コメントは日本語で OK
- コミットや push はユーザーの指示があってから行う
