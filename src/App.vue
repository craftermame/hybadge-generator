<script setup lang="ts">
import { computed } from 'vue'
import AttendeeTable from '@/components/AttendeeTable.vue'
import CsvImporter from '@/components/CsvImporter.vue'
import LogoManager from '@/components/LogoManager.vue'
import { clampCopies, useAppStore } from '@/composables/useAppStore'
import { FONT_BASE_URL, usePdfExport } from '@/composables/usePdfExport'
import { BADGE_GRID, TABLEWARE_GRID, blankCount, pageCount } from '@/lib/layout'

const store = useAppStore()
const { attendees, participants, logos, settings, affiliations, storageError } = store
const { generating, error, exportPdf } = usePdfExport()

// 名札
const badgePages = computed(() => pageCount(BADGE_GRID, participants.value.length))
const blanks = computed(() => blankCount(BADGE_GRID, participants.value.length))

// 食器用名札（参加者のうち食器記載名がある人）
const tablewareNames = computed(() =>
  participants.value.map((a) => a.tablewareName).filter((n) => n !== ''),
)
const missingTableware = computed(() => participants.value.length - tablewareNames.value.length)
const tablewareTotal = computed(() => tablewareNames.value.length * settings.value.tablewareCopies)
const tablewarePages = computed(() => pageCount(TABLEWARE_GRID, tablewareTotal.value))

const copies = computed({
  get: () => settings.value.tablewareCopies,
  set: (v: number) => {
    settings.value.tablewareCopies = clampCopies(v)
  },
})

function download() {
  return exportPdf(
    // jsPDF は大きいので、ボタンを押したときに読み込む
    async () =>
      (await import('@/lib/pdf')).generatePdf({
        fontBaseUrl: FONT_BASE_URL,
        badges: participants.value,
        logos: logos.value,
        badgeOptions: {
          printEmployment: settings.value.printEmployment,
          commentLabel: settings.value.commentLabel,
        },
        tablewareNames: tablewareNames.value,
        tablewareCopies: settings.value.tablewareCopies,
      }),
    'nametags.pdf',
  )
}

function clearAll() {
  if (confirm('読み込んだ参加者とロゴをすべて削除します。よろしいですか？')) {
    store.clearAll()
  }
}
</script>

<template>
  <main>
    <h1>名札ジェネレーター</h1>
    <p class="hint">
      首掛けストラップ用の名札（A4 縦）と、パーティーで食器につける名札（A4 横）を1つの PDF
      で作ります
    </p>

    <p v-if="storageError" class="error">{{ storageError }}</p>

    <section>
      <h2>1. 参加者マスタ（CSV）を選ぶ</h2>
      <CsvImporter />
    </section>

    <template v-if="attendees.length">
      <section>
        <h2>2. 参加者を選ぶ</h2>
        <AttendeeTable />
      </section>

      <section v-if="affiliations.length">
        <h2>3. ロゴを登録する（任意）</h2>
        <LogoManager />
      </section>

      <section>
        <h2>4. 名札の設定</h2>
        <p class="hint">100×70mm、A4 縦に 8枚。最終ページの余り枠は手書き用の名札になります</p>
        <p>
          <label>
            <input v-model="settings.printEmployment" type="checkbox" />
            雇用区分を印刷する
          </label>
        </p>
        <p>
          <label>
            コメント欄の質問文
            <input
              v-model="settings.commentLabel"
              type="text"
              class="comment-label"
              placeholder="例: 最近ハマっていることは？"
            />
          </label>
          <br />
          <span class="hint">空にすると何も印刷しません</span>
        </p>
      </section>

      <section>
        <h2>5. 食器用名札の設定</h2>
        <p class="hint">食器記載名を A4 横の よこ4×たて8 = 32マスに入れます</p>
        <p>
          <label>
            1人あたり
            <input v-model.lazy.number="copies" type="number" min="0" max="99" class="copies" />
            枚
          </label>
          <span class="hint">（0 にすると食器用名札は作りません）</span>
        </p>
        <p v-if="missingTableware" class="hint">
          食器記載名が空の参加者 {{ missingTableware }}名は食器用名札を作りません
        </p>
      </section>

      <section>
        <h2>6. PDFを出力する</h2>
        <table class="summary">
          <tbody>
            <tr>
              <th>名札</th>
              <td>
                {{ participants.length }}枚
                <template v-if="blanks">＋ 手書き用 {{ blanks }}枚</template>
              </td>
              <td>A4 縦 {{ badgePages }}ページ</td>
            </tr>
            <tr>
              <th>食器用名札</th>
              <td>
                {{ tablewareNames.length }}名 × {{ settings.tablewareCopies }}枚 =
                {{ tablewareTotal }}枚
              </td>
              <td>A4 横 {{ tablewarePages }}ページ</td>
            </tr>
          </tbody>
        </table>
        <p class="hint">印刷時は「実際のサイズ（100%）」を選んでください</p>
        <button
          type="button"
          class="primary"
          :disabled="generating || badgePages + tablewarePages === 0"
          @click="download"
        >
          {{ generating ? '作成中…' : 'PDFをダウンロード' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </section>

      <section class="danger-zone">
        <button type="button" @click="clearAll">データをすべて削除</button>
      </section>
    </template>
  </main>
</template>

<style scoped>
main {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px 16px 32px;
}
.comment-label {
  width: 100%;
  max-width: 28em;
  font-size: 1rem;
  padding: 4px 6px;
}
.copies {
  width: 4em;
  font-size: 1rem;
  padding: 2px 4px;
}
.summary {
  width: auto;
}
.danger-zone {
  margin-top: 48px;
}
</style>
