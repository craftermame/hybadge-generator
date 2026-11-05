<script setup lang="ts">
import { computed } from 'vue'
import { employmentStyle, rgbToCss } from '@/lib/employment'

const props = defineProps<{ employment: string }>()
const style = computed(() => {
  const { background, text } = employmentStyle(props.employment)
  const color = rgbToCss(text)
  return background
    ? { color, backgroundColor: rgbToCss(background), borderColor: rgbToCss(background) }
    : { color, borderColor: color }
})
</script>

<template>
  <span class="chip" :style="style">{{ employment }}</span>
</template>

<style scoped>
.chip {
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0 8px;
  border: 1.5px solid;
  border-radius: 999px;
  white-space: nowrap;
}
</style>
