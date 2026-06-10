import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue'
import echarts from '@/utils/echarts'
import { ChartStrategyFactory } from '@/strategies/chart/ChartStrategyFactory'
import { ChartType } from '@/strategies/chart/types'
import { useChartDataStore } from '@/stores/chart-data'
import { useChartInteraction } from './useChartInteraction'

/**
 * 图表 Composable — 整合策略 + Store + 交互 的入口
 *
 * 使用方式:
 *   const { chartRef, option, refresh } = useChart({
 *     chartId: 'revenue-trend',
 *     chartType: ChartType.LINE,
 *     dataKey: 'revenue',
 *   })
 */
export function useChart(config) {
  const {
    chartId,
    chartType,
    dataKey = chartId,
    staticData,
    height = '100%',
    theme = 'dark',
    enableDrillDown = true,
    enableLinkage = true,
  } = config

  const chartRef = ref()
  const instance = shallowRef(null)
  const strategy = shallowRef(null)
  const option = ref({})
  const loading = ref(false)

  // Store
  const dataStore = useChartDataStore()

  // 初始化策略
  strategy.value = ChartStrategyFactory.create(chartId, chartType)

  // 统一交互
  const interaction = useChartInteraction(chartId, strategy, {
    enableDrillDown,
    enableLinkage,
    onDrillDown: (params) => {
      console.log(`[${chartId}] 下钻:`, params)
    },
    onLinkage: (sourceId, params) => {
      console.log(`[${chartId}] 联动 来自 ${sourceId}:`, params)
    },
  })

  // ============ 数据获取 ============

  async function fetchData() {
    if (staticData) {
      dataStore.setDataSet(dataKey, staticData)
      return staticData
    }
    return dataStore.fetchChartData(dataKey)
  }

  async function refreshData() {
    loading.value = true
    await dataStore.refreshChartData(dataKey)
    loading.value = false
  }

  // ============ 渲染 ============

  function render() {
    if (!strategy.value) return

    // 从 Store 获取数据
    let data = dataStore.getDataByKey(dataKey)

    // 如果没有数据但有静态数据，使用静态数据
    if (!data && staticData) {
      data = staticData
    }

    if (!data) {
      // 使用默认空配置
      option.value = strategy.value.getDefaultOption(theme)
    } else {
      option.value = strategy.value.transformData(data, theme)
    }

    // 应用到 ECharts 实例
    instance.value?.setOption(option.value, true)
  }

  // ============ 初始化 ============

  function initChart() {
    if (!chartRef.value) return
    instance.value = echarts.init(chartRef.value)

    // 绑定交互事件
    const eventHandlers = interaction.buildEChartsEventHandlers()
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      instance.value?.on(event, handler)
    })

    render()
  }

  function resizeChart() {
    instance.value?.resize()
  }

  // ============ 响应式更新 ============

  let resizeObserver = null

  onMounted(async () => {
    loading.value = true
    await fetchData()
    initChart()

    if (chartRef.value) {
      resizeObserver = new ResizeObserver(() => resizeChart())
      resizeObserver.observe(chartRef.value)
    }
    window.addEventListener('resize', resizeChart)
    loading.value = false
  })

  onUnmounted(() => {
    instance.value?.dispose()
    resizeObserver?.disconnect()
    window.removeEventListener('resize', resizeChart)
    ChartStrategyFactory.destroy(chartId)
  })

  // 监听 Store 数据变化，自动重新渲染
  watch(
    () => dataStore.getDataByKey(dataKey),
    () => {
      render()
    },
    { deep: true }
  )

  return {
    chartRef,
    instance,
    strategy,
    option,
    loading,
    interaction,
    fetchData,
    refreshData,
    render,
    resizeChart,
  }
}
