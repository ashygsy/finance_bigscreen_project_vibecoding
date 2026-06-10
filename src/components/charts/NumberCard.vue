<template>
  <div class="number-card" :style="{ borderColor: color }">
    <div class="card-title">{{ title }}</div>
    <div class="card-value" :style="{ color }">
      <span v-if="prefix" class="card-prefix">{{ prefix }}</span>
      <span class="card-number">{{ displayValue }}</span>
      <span v-if="suffix" class="card-suffix">{{ suffix }}</span>
    </div>
    <div v-if="trend" class="card-trend">
      <span :class="['trend-badge', `trend-${trend}`]">
        <el-icon>
          <CaretTop v-if="trend === 'up'" />
          <CaretBottom v-else-if="trend === 'down'" />
          <Minus v-else />
        </el-icon>
        {{ trendValue }}%
      </span>
      <span class="trend-label">较上期</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CaretTop, CaretBottom, Minus } from '@element-plus/icons-vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: Number, required: true },
  prefix: String,
  suffix: String,
  trend: String,
  trendValue: Number,
  color: String,
})

const displayValue = computed(() => {
  if (props.value >= 10000) {
    return (props.value / 10000).toFixed(2) + '万'
  }
  if (props.value >= 100) {
    return props.value.toFixed(0)
  }
  return props.value.toFixed(2)
})
</script>

<style lang="scss" scoped>
.number-card {
  position: relative;
  padding: 20px 24px;
  background: rgba(6, 30, 93, 0.4);
  border: 1px solid;
  border-radius: 4px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--card-color, currentColor), transparent);
  }

  .card-title {
    font-size: 14px;
    color: #8899bb;
    margin-bottom: 8px;
  }

  .card-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    font-size: 32px;
    font-weight: 700;
    font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
    line-height: 1.2;

    .card-prefix,
    .card-suffix {
      font-size: 16px;
      font-weight: 400;
    }
  }

  .card-trend {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    font-size: 13px;

    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;

      &.trend-up {
        color: #00ff88;
        background: rgba(0, 255, 136, 0.1);
      }

      &.trend-down {
        color: #ff4d4f;
        background: rgba(255, 77, 79, 0.1);
      }

      &.trend-flat {
        color: #8899bb;
        background: rgba(136, 153, 187, 0.1);
      }
    }

    .trend-label {
      color: #667799;
    }
  }
}
</style>
