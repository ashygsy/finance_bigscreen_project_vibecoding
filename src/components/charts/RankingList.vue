<template>
  <div class="ranking-list">
    <div v-for="(item, index) in data" :key="index" class="ranking-item">
      <div :class="['rank-badge', `rank-${index + 1}`]">{{ index + 1 }}</div>
      <div class="rank-label">{{ item.label }}</div>
      <div class="rank-bar-wrap">
        <div class="rank-bar" :style="{ width: (item.value / maxValue) * 100 + '%' }"></div>
      </div>
      <div class="rank-value">{{ item.value.toLocaleString() }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
})

const maxValue = computed(() => Math.max(...props.data.map((d) => d.value), 1))
</script>

<style lang="scss" scoped>
.ranking-list {
  padding: 0 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.rank-badge {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  color: #8899bb;

  &.rank-1 { background: #ff4d4f; color: #fff; }
  &.rank-2 { background: #ff7a45; color: #fff; }
  &.rank-3 { background: #ffa940; color: #fff; }
}

.rank-label {
  flex: 0 0 80px;
  font-size: 13px;
  color: #c0cee0;
}

.rank-bar-wrap {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  overflow: hidden;

  .rank-bar {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #00ff88);
    border-radius: 4px;
    transition: width 0.6s ease;
  }
}

.rank-value {
  font-size: 14px;
  font-weight: 600;
  color: #00ff88;
  font-family: 'DIN Alternate', monospace;
  min-width: 60px;
  text-align: right;
}
</style>
