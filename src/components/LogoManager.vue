<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '@/composables/useAppStore'
import { resizeImageToDataUrl } from '@/lib/image'

const store = useAppStore()
const { logos, affiliations } = store
const error = ref<string | null>(null)

async function onSelected(affiliation: string, e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  error.value = null
  try {
    store.setLogo(affiliation, await resizeImageToDataUrl(file))
  } catch (err) {
    error.value = `${affiliation}: ${err instanceof Error ? err.message : String(err)}`
  }
}
</script>

<template>
  <p class="hint">名札の左上に小さく入ります。未登録の所属は所属名を文字で印刷します</p>
  <p v-if="error" class="error">{{ error }}</p>
  <table>
    <tbody>
      <tr v-for="aff in affiliations" :key="aff">
        <th>{{ aff }}</th>
        <td class="logo-cell">
          <img v-if="logos[aff]" :src="logos[aff]" :alt="`${aff} のロゴ`" />
          <span v-else class="hint">未登録</span>
        </td>
        <td>
          <input type="file" accept="image/*" @change="onSelected(aff, $event)" />
          <button v-if="logos[aff]" type="button" @click="store.removeLogo(aff)">削除</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.logo-cell img {
  max-height: 40px;
  max-width: 160px;
}
</style>
