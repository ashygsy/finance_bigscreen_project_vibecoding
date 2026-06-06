<template>
  <div class="screen-display" :class="`theme-${screenTheme}`">
    <!-- 控制按钮 -->
    <div class="display-controls">
      <el-button text :icon="FullScreen" size="small" @click="toggleFullscreen">
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </el-button>
      <el-button text :icon="Refresh" size="small" @click="handleRefreshAll">
        刷新
      </el-button>
    </div>

    <!-- DataV 全屏容器 -->
    <dv-full-screen-container>
      <!-- 顶部标题栏 -->
      <div class="screen-header">
        <dv-decoration-8 :color="['#00d4ff', '#0050b3']" style="width: 300px; height: 50px" />
        <h1 class="screen-title">金融数据可视化平台</h1>
        <dv-decoration-8 :color="['#00d4ff', '#0050b3']" style="width: 300px; height: 50px" />
      </div>

      <div class="screen-body">
        <!-- 左侧区域 -->
        <div class="panel-left">
          <!-- 分行排名 -->
          <div class="panel">
            <div class="panel-header">
              <dv-decoration-3 style="width: 160px; height: 20px" />
              <span class="panel-title">各分行业绩排名</span>
              <dv-decoration-3 style="width: 160px; height: 20px" />
            </div>
            <div class="panel-body">
              <RankingList :data="branchRankingData" />
            </div>
          </div>

          <!-- 风险雷达图 — 策略模式: RADAR -->
          <div class="panel" style="flex: 1">
            <div class="panel-header">
              <span class="panel-title">风险指标评估</span>
            </div>
            <div class="panel-body">
              <BaseChart
                chart-id="risk-radar"
                chart-type="radar"
                :static-data="riskRadarChartData"
                height="100%"
              />
            </div>
          </div>
        </div>

        <!-- 中间区域 -->
        <div class="panel-center">
          <!-- 指标卡片行 -->
          <div class="number-cards-row">
            <div v-for="card in numberCards" :key="card.title" class="card-col">
              <NumberCard v-bind="card" />
            </div>
          </div>

          <!-- 交易趋势 — 策略模式: LINE -->
          <div class="panel" style="flex: 1">
            <div class="panel-header">
              <span class="panel-title">交易实时趋势</span>
              <dv-decoration-1 style="width: 120px; height: 20px" />
            </div>
            <div class="panel-body">
              <BaseChart
                chart-id="trade-trend"
                chart-type="line"
                :static-data="tradeTrendChartData"
                height="100%"
                @drill-down="onDrillDown"
              />
            </div>
          </div>

          <!-- 产品销量 & 业务分布 -->
          <div class="bottom-row">
            <!-- 产品销量 — 策略模式: BAR -->
            <div class="panel half">
              <div class="panel-header">
                <span class="panel-title">金融产品销量</span>
              </div>
              <div class="panel-body">
                <BaseChart
                  chart-id="product-sales"
                  chart-type="bar"
                  :static-data="productSalesChartData"
                  height="100%"
                />
              </div>
            </div>
            <!-- 业务分布 — 策略模式: PIE -->
            <div class="panel half">
              <div class="panel-header">
                <span class="panel-title">业务分布</span>
              </div>
              <div class="panel-body">
                <BaseChart
                  chart-id="business-dist"
                  chart-type="pie"
                  :static-data="businessPieChartData"
                  height="100%"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧区域 -->
        <div class="panel-right">
          <!-- 日期时间 -->
          <div class="panel">
            <div class="panel-body">
              <div class="datetime-display">
                <div class="date">{{ currentDate }}</div>
                <div class="time">{{ currentTime }}</div>
                <div class="weekday">{{ currentWeekday }}</div>
              </div>
            </div>
          </div>

          <!-- 实时交易滚动 -->
          <div class="panel" style="flex: 1">
            <div class="panel-header">
              <span class="panel-title">实时交易流水</span>
            </div>
            <div class="panel-body">
              <dv-scroll-board :config="scrollBoardConfig" style="height: 100%" />
            </div>
          </div>

          <!-- 客户增长 — 策略模式: LINE -->
          <div class="panel custom-panel">
            <div class="panel-header">
              <span class="panel-title">客户增长趋势</span>
            </div>
            <div class="panel-body">
              <BaseChart
                chart-id="customer-growth"
                chart-type="line"
                :static-data="customerGrowthChartData"
                height="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </dv-full-screen-container>
  </div>
</template>

<script setup lang="ts">
// ============================================================
// 数据大屏展示页 — 接入策略模式 + Pinia Store
//
// 数据流:
//   mock 数据 → Pinia Store (mutation: setDataSet)
//   BaseChart ← Store (getter: getDataByKey)
//   BaseChart → ChartStrategyFactory.create(chartType) → transformData()
//   → ECharts 渲染
//
// 交互流:
//   用户点击 → useChartInteraction.handleClick → onDrillDown
//   用户缩放 → useChartInteraction.handleZoom  → 联动其他图表
// ============================================================
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { FullScreen, Refresh } from '@element-plus/icons-vue'
import {
  Decoration1,
  Decoration3,
  Decoration8,
  FullScreenContainer,
  ScrollBoard,
} from '@kjgl77/datav-vue3'
import BaseChart from '@/components/charts/BaseChart.vue'
import NumberCard from '@/components/charts/NumberCard.vue'
import RankingList from '@/components/charts/RankingList.vue'
import { useChartDataStore } from '@/stores/chart-data'
import { ChartType } from '@/strategies/chart/types'
import type { ChartData } from '@/strategies/chart/types'
import {
  mockNumberCards,
  mockTradeTrend,
  mockBusinessDist,
  mockBranchRanking,
  mockRiskRadar,
  mockTransactions,
  mockCustomerGrowth,
  mockProductSales,
} from '@/utils/mock-data'

// ============ Store ============
const chartDataStore = useChartDataStore()

// ============ 状态 ============
const screenTheme = ref('dark')
const isFullscreen = ref(false)
const numberCards = ref(mockNumberCards)

// ============ 日期时间 ============
const currentDate = ref('')
const currentTime = ref('')
const currentWeekday = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateDateTime() {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentWeekday.value = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
}

// ============ 将 mock 数据转换为 ChartData 协议并注册到 Store ============

// 交易趋势 → ChartData
const tradeTrendChartData = computed<ChartData>(() => ({
  id: 'trade-trend',
  chartType: ChartType.LINE,
  dimensions: ['time'],
  measures: mockTradeTrend.series.map((s) => s.name),
  rawData: mockTradeTrend.xAxis.map((x, i) => ({
    time: x,
    ...Object.fromEntries(mockTradeTrend.series.map((s) => [s.name, s.data[i]])),
  })),
}))

// 风险雷达 → ChartData
const riskRadarChartData = computed<ChartData>(() => ({
  id: 'risk-radar',
  chartType: ChartType.RADAR,
  dimensions: mockRiskRadar.indicator.map((ind) => ind.name),
  measures: ['value'],
  rawData: mockRiskRadar.data.map((d) => ({
    name: d.name,
    ...Object.fromEntries(d.value.map((v, i) => [mockRiskRadar.indicator[i].name, v])),
  })),
}))

// 业务分布 → ChartData
const businessPieChartData = computed<ChartData>(() => ({
  id: 'business-dist',
  chartType: ChartType.PIE,
  dimensions: ['name'],
  measures: ['value'],
  rawData: mockBusinessDist,
}))

// 产品销量 → ChartData (混合图表用 bar 策略)
const productSalesChartData = computed<ChartData>(() => ({
  id: 'product-sales',
  chartType: ChartType.BAR,
  dimensions: ['product'],
  measures: mockProductSales.series.map((s) => s.name),
  rawData: mockProductSales.xAxis.map((x, i) => ({
    product: x,
    ...Object.fromEntries(mockProductSales.series.map((s) => [s.name, s.data[i]])),
  })),
}))

// 客户增长 → ChartData
const customerGrowthChartData = computed<ChartData>(() => ({
  id: 'customer-growth',
  chartType: ChartType.LINE,
  dimensions: ['month'],
  measures: mockCustomerGrowth.series.map((s) => s.name),
  rawData: mockCustomerGrowth.xAxis.map((x, i) => ({
    month: x,
    ...Object.fromEntries(mockCustomerGrowth.series.map((s) => [s.name, s.data[i]])),
  })),
}))

// 分行排名
const branchRankingData = computed(() =>
  mockBranchRanking.yAxis.map((label, i) => ({
    label,
    value: mockBranchRanking.data[i],
  }))
)

// 滚动表格配置
const scrollBoardConfig = computed(() => ({
  header: ['交易流水号', '类型', '金额(元)', '时间', '状态'],
  data: mockTransactions.map((t) => [
    t.id,
    t.type,
    t.amount,
    t.time,
    t.status === 'success' ? '成功' : '处理中',
  ]),
  rowNum: 8,
  headerBGC: 'rgba(6, 30, 93, 0.6)',
  oddRowBGC: 'rgba(6, 30, 93, 0.2)',
  evenRowBGC: 'rgba(6, 30, 93, 0.35)',
  headerHeight: 42,
  columnWidth: [90, 70, 100, 70, 60],
  align: ['center'] as any,
  waitTime: 3000,
  carousel: 'single' as const,
}))

// ============ 交互处理 ============

/** 下钻回调 — 点击图表元素时触发 */
function onDrillDown(params: any) {
  console.log('[大屏] 下钻事件:', params)
  ElMessage.info(`下钻: ${params.name || params.seriesName}`)
}

// ============ 全局刷新 ============

function handleRefreshAll() {
  // 1. 更新指标卡 (mutation 式更新)
  numberCards.value = mockNumberCards.map((c) => ({
    ...c,
    value: c.value * (1 + (Math.random() - 0.5) * 0.05),
    trendValue: +(c.trendValue + (Math.random() - 0.5) * 2).toFixed(1),
  }))

  // 2. 通过 Store action 刷新所有图表数据
  chartDataStore.refreshAll()
  ElMessage.success('数据已刷新')
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// ============ 生命周期 ============

onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)

  // 初始化: 将 staticData 批量注册到 Pinia Store (mutation)
  chartDataStore.bulkSetDataSets([
    { key: 'trade-trend', data: tradeTrendChartData.value },
    { key: 'risk-radar', data: riskRadarChartData.value },
    { key: 'business-dist', data: businessPieChartData.value },
    { key: 'product-sales', data: productSalesChartData.value },
    { key: 'customer-growth', data: customerGrowthChartData.value },
  ])
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style lang="scss" scoped>
.screen-display {
  width: 100vw;
  height: 100vh;
  background: $screen-bg;
  color: $screen-text;
  overflow: hidden;
  position: relative;

  .display-controls {
    position: absolute;
    top: 12px;
    right: 20px;
    z-index: 100;
    display: flex;
    gap: 8px;

    .el-button {
      color: #8899bb;
      &:hover { color: #00d4ff; }
    }
  }
}

.screen-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 12px 0 8px;

  .screen-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 6px;
    background: linear-gradient(90deg, #00d4ff, #00ff88);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.screen-body {
  display: flex;
  gap: 16px;
  padding: 0 20px;
  height: calc(100vh - 90px);
}

.panel-left { width: 360px; display: flex; flex-direction: column; gap: 16px; }
.panel-right { width: 400px; display: flex; flex-direction: column; gap: 16px; }
.panel-center { flex: 1; display: flex; flex-direction: column; gap: 16px; }

.panel {
  background: $screen-panel-bg;
  border: 1px solid $screen-border;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 168, 255, 0.15);

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: #c0cee0;
      white-space: nowrap;
    }
  }

  .panel-body {
    flex: 1;
    padding: 12px;
    overflow: hidden;
  }
}

.number-cards-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.bottom-row {
  display: flex;
  gap: 16px;
  flex: 1;
  .half { flex: 1; }
}

.datetime-display {
  text-align: center;
  padding: 12px 0;
  .date { font-size: 18px; color: #8899bb; margin-bottom: 4px; }
  .time {
    font-size: 40px;
    font-weight: 700;
    font-family: 'DIN Alternate', monospace;
    color: #00d4ff;
    line-height: 1.2;
  }
  .weekday { font-size: 14px; color: #8899bb; margin-top: 4px; }
}

.custom-panel { height: 280px; }
</style>
