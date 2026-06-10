<template>
  <div class="base-chart" :style="{ width: '100%', height: height }">
    <!-- 加载遮罩 -->
    <div v-if="loading" class="chart-loading">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
    </div>
    <!-- 图表容器 -->
    <div ref="chartRef" class="chart-inner"></div>
  </div>
</template>

<script setup>
// ============================================================
// BaseChart — 基于策略模式的通用图表组件
//
// 支持两种使用方式:
// 1. 策略模式（推荐）: 传入 chartType，自动使用策略生成配置
//    <BaseChart chart-id="revenue" chart-type="line" :static-data="data" />
//
// 2. 直接模式（兼容）: 传入 option，直接渲染
//    <BaseChart :option="echartsOption" />
// ============================================================
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import { ChartStrategyFactory } from '@/strategies/chart/ChartStrategyFactory'
import { ChartType } from '@/strategies/chart/types'
import { useChartDataStore } from '@/stores/chart-data'
import { useChartInteraction } from '@/composables/useChartInteraction'

// ============ Props ============
const props = defineProps({
  // 策略模式 props
  chartId: String,
  chartType: String, // ChartType 枚举值: 'line' | 'bar' | 'pie' | 'radar' | 'scatter' | 'gauge'
  staticData: Object,
  dataKey: String,

  // 直接模式 props（兼容）
  option: Object,

  // 通用 props
  height: { type: String, default: '100%' },
  theme: { type: String, default: 'dark' },
  enableDrillDown: { type: Boolean, default: true },
  enableLinkage: { type: Boolean, default: true },
})

// ============ Emits ============
const emit = defineEmits(['chart-ready', 'drill-down', 'linkage'])

// ============ State ============
const chartRef = ref(null)
let chartInstance = null
const loading = ref(false)
const dataStore = useChartDataStore()

// 判断使用何种模式
const useStrategy = computed(() => !!(props.chartId && props.chartType))

// 交互 composable（仅策略模式）
const interaction = computed(() => {
  if (!useStrategy.value || !props.chartId) return null
  return useChartInteraction(
    props.chartId,
    computed(() => ChartStrategyFactory.get(props.chartId) || null),
    {
      enableDrillDown: props.enableDrillDown,
      enableLinkage: props.enableLinkage,
      onDrillDown: (params) => emit('drill-down', params),
      onLinkage: (sourceId, params) => emit('linkage', sourceId, params),
    }
  )
})

// ============ 暗色主题默认配置 ============
const darkThemeDefaults = {
  color: ['#00d4ff', '#00ff88', '#ffa940', '#ff4d4f', '#9254de', '#36cfc9', '#f759ab'],
  backgroundColor: 'transparent',
  textStyle: { color: '#8899bb' },
  title: { textStyle: { color: '#e0e6f0' } },
  legend: { textStyle: { color: '#8899bb' } },
  tooltip: {
    backgroundColor: 'rgba(6, 30, 93, 0.9)',
    borderColor: 'rgba(0, 168, 255, 0.3)',
    textStyle: { color: '#e0e6f0' },
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 60,
    containLabel: true,
  },
}

// ============ 获取最终渲染配置 ============
function resolveOption() {
  // 模式1: 策略模式 — 由策略工厂根据 chartType 自动生成配置
  if (useStrategy.value && props.chartId && props.chartType) {
    const strategy = ChartStrategyFactory.create(
      props.chartId,
      props.chartType
    )

    // 尝试从 Store 获取数据
    const dataKey = props.dataKey || props.chartId
    let data = dataStore.getDataByKey(dataKey)

    // 优先使用 staticData
    if (props.staticData) {
      data = props.staticData
    }

    if (data) {
      return strategy.transformData(data, props.theme)
    }
    return strategy.getDefaultOption(props.theme)
  }

  // 模式2: 直接模式 — 使用外部传入的 option
  let opt = props.option || {}
  if (props.theme === 'dark') {
    opt = { ...darkThemeDefaults, ...opt }
  }
  return opt
}

// ============ 初始化 ============
function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  // 策略模式: 绑定交互事件
  if (interaction.value && chartInstance) {
    const handlers = interaction.value.buildEChartsEventHandlers()
    Object.entries(handlers).forEach(([event, handler]) => {
      chartInstance?.on(event, handler)
    })
  }

  chartInstance.setOption(resolveOption())
  emit('chart-ready', chartInstance)
}

function resizeChart() {
  chartInstance?.resize()
}

let resizeObserver = null

onMounted(() => {
  initChart()

  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => resizeChart())
    resizeObserver.observe(chartRef.value)
  }
  window.addEventListener('resize', resizeChart)
})

onUnmounted(() => {
  chartInstance?.dispose()
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resizeChart)

  // 清理策略实例
  if (props.chartId) {
    ChartStrategyFactory.destroy(props.chartId)
  }
})

// 响应 props 和 Store 变化
watch(
  () => [props.option, props.staticData, props.chartType, dataStore.getDataByKey(props.dataKey || props.chartId || '')],
  () => {
    chartInstance?.setOption(resolveOption(), true)
  },
  { deep: true }
)

// ============ 暴露方法 ============
defineExpose({
  getInstance: () => chartInstance,
  refresh: () => chartInstance?.setOption(resolveOption(), true),
  resize: resizeChart,
})
</script>

<style lang="scss" scoped>
.base-chart {
  position: relative;
  min-height: 200px;

  .chart-inner {
    width: 100%;
    height: 100%;
  }

  .chart-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 22, 51, 0.6);
    z-index: 10;
    color: #00d4ff;
  }
}
</style>
