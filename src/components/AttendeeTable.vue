<script setup lang="ts">
import { useAppStore } from '@/composables/useAppStore'
import EmploymentChip from './EmploymentChip.vue'

const store = useAppStore()
const { attendees, participants } = store
</script>

<template>
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
        <th>食器記載名</th>
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
        <td>
          <template v-if="a.tablewareName">{{ a.tablewareName }}</template>
          <span v-else class="hint">（なし）</span>
        </td>
        <td>{{ a.affiliation }}</td>
        <td><EmploymentChip v-if="a.employment" :employment="a.employment" /></td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.check {
  width: 3em;
  text-align: center;
}
tr.absent td {
  color: #aaa;
}
tr.absent :deep(.chip) {
  opacity: 0.4;
}
</style>
