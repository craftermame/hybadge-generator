<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/composables/useAppStore'
import { CsvError, readCsvFile } from '@/lib/csv'

const store = useAppStore()
const messages = ref<string[]>([])
const error = ref<string | null>(null)

async function onSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 同じファイルを選び直しても change が発火するように
  if (!file) return
  error.value = null
  messages.value = []
  try {
    const { rows, warnings } = await readCsvFile(file)
    store.importRows(rows)
    messages.value = [`${rows.length}名を読み込みました`, ...warnings]
  } catch (err) {
    error.value =
      err instanceof CsvError ? err.message : `CSVを読み込めませんでした: ${String(err)}`
  }
}
</script>

<template>
  <p class="hint">
    1行目に「名札記載名,食器記載名,所属,雇用形態」の見出しを入れてください（UTF-8 / Shift_JIS
    対応）。名札と食器用名札で共通です。読み直しても参加チェックは引き継がれます
  </p>
  <input type="file" accept=".csv,text/csv" @change="onSelected" />
  <p v-if="error" class="error">{{ error }}</p>
  <ul v-if="messages.length" class="messages">
    <li v-for="m in messages" :key="m">{{ m }}</li>
  </ul>
</template>

<style scoped>
.messages {
  font-size: 0.9rem;
}
</style>
