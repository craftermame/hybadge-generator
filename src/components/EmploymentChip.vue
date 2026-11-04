<script setup lang="ts">
import { computed } from 'vue'
import { employmentColor, rgbToCss } from '@/lib/employment'

const props = defineProps<{ employment: string }>()
const color = computed(() => rgbToCss(employmentColor(props.employment)))
</script>

<template>
  <span class="chip" :style="{ color, borderColor: color }">{{ employment }}</span>
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
