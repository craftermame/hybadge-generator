<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBadgeStore } from '@/composables/useBadgeStore'
import { CsvError, readCsvFile } from '@/lib/csv'
import { resizeImageToDataUrl } from '@/lib/image'
import { blankCount, pageCount } from '@/lib/layout'
import { employmentColor, rgbToCss } from '@/lib/employment'
import { generateBadgePdf } from '@/lib/pdf'

const store = useBadgeStore()
const { attendees, participants, logos, settings, affiliations, storageError } = store

const csvMessages = ref<string[]>([])
const csvError = ref<string | null>(null)
const logoError = ref<string | null>(null)
const pdfError = ref<string | null>(null)
const generating = ref(false)

const pages = computed(() => pageCount(participants.value.length))
const blanks = computed(() => blankCount(participants.value.length))

async function onCsvSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 同じファイルを選び直しても change が発火するように
  if (!file) return
  csvError.value = null
  csvMessages.value = []
  try {
    const { rows, warnings } = await readCsvFile(file)
    store.importRows(rows)
    csvMessages.value = [`${rows.length}名を読み込みました`, ...warnings]
  } catch (err) {
    csvError.value =
      err instanceof CsvError ? err.message : `CSVを読み込めませんでした: ${String(err)}`
  }
}

async function onLogoSelected(affiliation: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  logoError.value = null
  try {
    store.setLogo(affiliation, await resizeImageToDataUrl(file))
  } catch (err) {
    logoError.value = `${affiliation}: ${err instanceof Error ? err.message : String(err)}`
  }
}

async function exportPdf() {
  pdfError.value = null
  generating.value = true
  try {
    const doc = await generateBadgePdf(participants.value, logos.value, {
      fontBaseUrl: `${import.meta.env.BASE_URL}fonts/`,
      printEmployment: settings.value.printEmployment,
      commentLabel: settings.value.commentLabel,
    })
    doc.save('badges.pdf')
  } catch (err) {
    pdfError.value = `PDFを作成できませんでした: ${err instanceof Error ? err.message : String(err)}`
  } finally {
    generating.value = false
  }
}

function clearAll() {
  if (confirm('読み込んだ参加者とロゴをすべて削除します。よろしいですか？')) {
    store.clearAll()
    csvMessages.value = []
  }
}
</script>

<template>
  <main>
    <h1>名札ジェネレーター</h1>

    <p v-if="storageError" class="error">{{ storageError }}</p>

    <section>
      <h2>1. 参加者マスタ（CSV）を選ぶ</h2>
      <p class="hint">
        1行目に「名札記載名,所属,雇用区分」の見出しを入れてください（UTF-8 / Shift_JIS 対応）。
        読み直しても参加チェックは引き継がれます
      </p>
      <input type="file" accept=".csv,text/csv" @change="onCsvSelected" />
      <p v-if="csvError" class="error">{{ csvError }}</p>
      <ul v-if="csvMessages.length" class="messages">
        <li v-for="m in csvMessages" :key="m">{{ m }}</li>
      </ul>
    </section>

    <section v-if="attendees.length">
      <h2>2. 参加者を選ぶ</h2>
      <p>
        参加 {{ participants.length }} / 全 {{ attendees.length }}名
        <button type="button" @click="store.setAllParticipating(true)">全員参加</button>
        <button type="button" @click="store.setAllParticipating(false)">全員解除</button>
      </p>
      <table>
        <thead>
          <tr>
            <th class="check">参加</th>
            <th>名札記載名</th>
            <th>所属</th>
            <th>雇用区分</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, i) in attendees" :key="i" :class="{ absent: !a.participating }">
            <td class="check">
              <input
                v-model="a.participating"
                type="checkbox"
                :aria-label="`${a.name}（${a.affiliation}）が参加`"
              />
            </td>
            <td>{{ a.name }}</td>
            <td>{{ a.affiliation }}</td>
            <td>
              <span
                v-if="a.employment"
                class="employment"
                :style="{
                  color: rgbToCss(employmentColor(a.employment)),
                  borderColor: rgbToCss(employmentColor(a.employment)),
                }"
                >{{ a.employment }}</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="affiliations.length">
      <h2>3. ロゴを登録する（任意）</h2>
      <p class="hint">名札の左上に小さく入ります。未登録の所属は所属名を文字で印刷します</p>
      <p v-if="logoError" class="error">{{ logoError }}</p>
      <table>
        <tbody>
          <tr v-for="aff in affiliations" :key="aff">
            <th>{{ aff }}</th>
            <td class="logo-cell">
              <img v-if="logos[aff]" :src="logos[aff]" :alt="`${aff} のロゴ`" />
              <span v-else class="hint">未登録</span>
            </td>
            <td>
              <input type="file" accept="image/*" @change="onLogoSelected(aff, $event)" />
              <button v-if="logos[aff]" type="button" @click="store.removeLogo(aff)">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section v-if="attendees.length">
      <h2>4. PDFを出力する</h2>
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
      <p>
        参加 {{ participants.length }}名 / A4 {{ pages }}枚（100×70mm × 8枚/ページ）
        <template v-if="blanks">＋ 余白に手書き用 {{ blanks }}枚</template>
      </p>
      <p class="hint">印刷時は「実際のサイズ（100%）」を選んでください</p>
      <button
        type="button"
        class="primary"
        :disabled="generating || participants.length === 0"
        @click="exportPdf"
      >
        {{ generating ? '作成中…' : 'PDFをダウンロード' }}
      </button>
      <p v-if="pdfError" class="error">{{ pdfError }}</p>
    </section>

    <section v-if="attendees.length">
      <p><button type="button" @click="clearAll">データをすべて削除</button></p>
    </section>
  </main>
</template>

<style scoped>
main {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}
section {
  margin-top: 24px;
}
h2 {
  font-size: 1.1rem;
}
.hint {
  color: #666;
  font-size: 0.9rem;
}
.error {
  color: #c00;
}
.messages {
  font-size: 0.9rem;
}
table {
  border-collapse: collapse;
  width: 100%;
}
th,
td {
  border-bottom: 1px solid #ddd;
  padding: 6px 8px;
  text-align: left;
  vertical-align: middle;
}
.check {
  width: 3em;
  text-align: center;
}
tr.absent td {
  color: #aaa;
}
tr.absent .employment {
  opacity: 0.4;
}
.employment {
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0 8px;
  border: 1.5px solid;
  border-radius: 999px;
}
.comment-label {
  width: 100%;
  max-width: 28em;
  font-size: 1rem;
  padding: 4px 6px;
}
.logo-cell img {
  max-height: 40px;
  max-width: 160px;
}
button.primary {
  font-size: 1rem;
  padding: 8px 16px;
}
</style>
