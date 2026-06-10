<template>
  //大屏显示容器 screen-display相对定位 :class 是 Vue 的动态类名绑定，可以根据数据变量的值，动态添加或移除 CSS 类名
  //theme-${screenTheme}`theme-${screenTheme}模板字符串，screenTheme 是一个响应式变量
  <div class="screen-display" :class="[`theme-${screenTheme}`, { 'is-fullscreen': isFullscreen }]">
    <!-- 控制按钮 -->
    <div class="display-controls">
      <el-button text :icon="FullScreen" size="small" @click="toggleFullscreen">
        {{ isFullscreen ? '退出全屏' : '全屏' }}
      </el-button>
      <el-button text :icon="Refresh" size="small" @click="handleRefreshAll">
        刷新
      </el-button>
    </div>

    <!-- 大屏内容容器 -->
    <div class="datav-container">
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

          <!-- 实时交易滚动 — VirtualList 优化 -->
          <div class="panel" style="flex: 1">
            <div class="panel-header">
              <span class="panel-title">实时交易流水</span>
              <el-select
                v-model="txFilter"
                size="small"
                placeholder="全部类型"
                style="width: 110px; margin-left: 8px"
                @change="applyTxFilter"
              >
                <el-option label="全部类型" value="" />
                <el-option label="转账" value="转账" />
                <el-option label="消费" value="消费" />
                <el-option label="理财" value="理财申购" />
                <el-option label="贷款" value="贷款放款" />
              </el-select>
              <!-- SSE 连接状态指示 -->
              <span :class="['sse-dot', { connected: sseConnected }]" :title="sseConnected ? 'SSE 已连接' : 'SSE 未连接'"></span>
            </div>
            <div class="panel-body virtual-list-panel">
              <VirtualList
                v-if="filteredTransactions.length > 0"
                ref="txListRef"
                :data="filteredTransactions"
                :item-height="42"
                :buffer="8"
                item-key="id"
                container-height="100%"
                :auto-scroll="true"
                :scroll-speed="35"
                :resume-delay="3000"
                :load-threshold="1.5"
                :has-more="txHasMore"
                @load-more="loadMoreTransactions"
              >
                <template #item="{ item }">
                  <div class="tx-row">
                    <span class="tx-col tx-id">{{ item.id }}</span>
                    <span class="tx-col tx-type">{{ item.type }}</span>
                    <span class="tx-col tx-amount">¥{{ Number(item.amount).toLocaleString() }}</span>
                    <span class="tx-col tx-time">{{ item.time }}</span>
                    <span :class="['tx-col', 'tx-status', item.status === 'success' ? 'tx-ok' : 'tx-pending']">
                      {{ item.status === 'success' ? '成功' : '处理中' }}
                    </span>
                  </div>
                </template>
              </VirtualList>
              <div v-else class="tx-empty">暂无交易数据</div>
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
    </div>
  </div>
</template>

<script setup>
// ============================================================
// 数据大屏展示页 — BFF + SSE + Worker 数据密集型优化版
//
// 数据流:
//   1. 首次加载: RESTful API → ref → ChartData → staticData
//   2. 实时更新: SSE 推送 → 增量更新 ref → 图表自动响应
//   3. 海量数据: Web Worker 抽样 → 过滤 → 主线程渲染
//   4. 长列表: VirtualList 仅渲染可视区 DOM
// ============================================================
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { FullScreen, Refresh } from '@element-plus/icons-vue'
import {
  Decoration1,
  Decoration3,
  Decoration8,
} from '@kjgl77/datav-vue3'
import BaseChart from '@/components/charts/BaseChart.vue'
import NumberCard from '@/components/charts/NumberCard.vue'
import RankingList from '@/components/charts/RankingList.vue'
import VirtualList from '@/components/common/VirtualList.vue'
import { useAppStore } from '@/stores/app'
import { ChartType } from '@/strategies/chart/types'
import { useSSE } from '@/composables/useSSE'
import api from '@/api'

// ============ Store ============
const appStore = useAppStore()

// ============ 从 API 获取的数据 ============
const apiTradeTrend = ref(null)
const apiRiskRadar = ref(null)
const apiBusinessDist = ref(null)
const apiBranchRanking = ref(null)
const apiProductSales = ref(null)
const apiCustomerGrowth = ref(null)
const apiTransactions = ref([])

// ============ 交易流水分页加载 ============
const txPage = ref(1)           // 当前已加载的页码
const txHasMore = ref(true)     // 后端是否还有更多数据
const txLoadingMore = ref(false)// 是否正在加载更多
const TX_PAGE_SIZE = 50

async function loadMoreTransactions() {
  if (txLoadingMore.value || !txHasMore.value) return
  txLoadingMore.value = true

  try {
    const nextPage = txPage.value + 1
    const result = await api.get('/trade-history', {
      params: {
        page: nextPage,
        pageSize: TX_PAGE_SIZE,
        ...(txFilter.value ? { type: txFilter.value } : {}),
      },
    })

    if (result && result.data && result.data.length > 0) {
      // 追加到尾部，去重
      const existingIds = new Set(apiTransactions.value.map((t) => t.id))
      const newItems = result.data.filter((t) => !existingIds.has(t.id))
      apiTransactions.value = [...apiTransactions.value, ...newItems]
      txPage.value = nextPage
      txHasMore.value = result.page < result.totalPages
    } else {
      txHasMore.value = false
    }
  } catch (err) {
    console.error('[大屏] 加载更多交易失败:', err)
  } finally {
    txLoadingMore.value = false
    txListRef.value?.loadMoreDone()
  }
}

// ============ 状态 ============
const screenTheme = ref('dark')
const isFullscreen = computed(() => appStore.dataScreenFullscreen)
const numberCards = ref([])
const txFilter = ref('')
const txListRef = ref(null) // VirtualList 组件引用
const filteredTransactions = computed(() => {
  const txns = apiTransactions.value
  if (!txFilter.value) return txns
  return txns.filter((t) => t.type === txFilter.value)
})

// 筛选变更时重置分页并重新加载
async function applyTxFilter() {
  txPage.value = 1
  txHasMore.value = true
  txLoadingMore.value = false
  try {
    const result = await api.get('/trade-history', {
      params: { page: 1, pageSize: TX_PAGE_SIZE, ...(txFilter.value ? { type: txFilter.value } : {}) },
    })
    if (result && result.data) {
      apiTransactions.value = result.data
      txHasMore.value = result.page < result.totalPages
    }
  } catch (err) {
    console.error('[大屏] 筛选交易失败:', err)
  }
  txListRef.value?.refreshAndReset()
}

// ============ SSE 实时更新 ============
const { connected: sseConnected } = useSSE({
  types: ['indicators', 'trade-trend', 'transactions'],
  onMessage: (eventType, data) => {
    switch (eventType) {
      case 'indicators':
        if (Array.isArray(data)) numberCards.value = data
        break
      case 'trade-trend':
        apiTradeTrend.value = data
        break
      case 'transactions':
        if (Array.isArray(data)) {
          const newTxns = data.filter(
            (t) => !apiTransactions.value.some((e) => e.id === t.id)
          )
          if (newTxns.length > 0) {
            // 计算顶部插入导致的 scrollTop 偏移量，防止视图跳动
            const addedHeight = newTxns.length * 42 // itemHeight
            apiTransactions.value = [...newTxns, ...apiTransactions.value].slice(0, 2000)

            // 调整滚动位置补偿顶部插入，保持用户当前视野不变
            nextTick(() => {
              if (txListRef.value?.userActive) {
                // 用户正在浏览历史 → 补偿偏移
                txListRef.value?.adjustScrollTop(addedHeight)
              } else {
                // 用户未交互 → 滚动到顶部展示最新数据
                txListRef.value?.scrollToTop()
              }
            })
          }
        }
        break
    }
  },
})

// ============ Web Worker ============
let dataWorker = null

function initWorker() {
  try {
    dataWorker = new Worker(new URL('@/workers/dataWorker.js', import.meta.url), { type: 'module' })
  } catch (e) {
    console.warn('[大屏] Web Worker 初始化失败，降级为主线程处理:', e.message)
  }
}

/** 通过 Worker 对大数据集进行 LTTB 抽样 */
function sampleDataViaWorker(data, threshold, valueKey) {
  return new Promise((resolve) => {
    if (!dataWorker) {
      // 降级: 主线程等间隔采样
      const step = Math.ceil(data.length / threshold)
      const result = data.filter((_, i) => i % step === 0)
      return resolve(result)
    }

    const id = Date.now() + Math.random()
    const handler = (e) => {
      if (e.data.id === id) {
        dataWorker.removeEventListener('message', handler)
        resolve(e.data.success ? e.data.data : data)
      }
    }
    dataWorker.addEventListener('message', handler)
    dataWorker.postMessage({ id, type: 'lttb-sample', payload: { data, threshold, valueKey } })
  })
}

// ============ 日期时间 ============
const currentDate = ref('')
const currentTime = ref('')
const currentWeekday = ref('')
let timer = null

function updateDateTime() {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentWeekday.value = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]
}

// ============ 将 API 数据转换为 ChartData 协议 ============

// 交易趋势 → ChartData（超大数据集时通过 Worker 抽样）
const tradeTrendChartData = computed(() => {
  const data = apiTradeTrend.value
  if (!data || !data.series) return null
  const rawData = data.xAxis.map((x, i) => ({
    time: x,
    ...Object.fromEntries(data.series.map((s) => [s.name, s.data[i]])),
  }))
  return {
    id: 'trade-trend',
    chartType: ChartType.LINE,
    dimensions: ['time'],
    measures: data.series.map((s) => s.name),
    rawData: rawData.length > 500 ? rawData.filter((_, i) => i % Math.ceil(rawData.length / 500) === 0) : rawData,
  }
})

// 风险雷达 → ChartData
const riskRadarChartData = computed(() => {
  const data = apiRiskRadar.value
  if (!data || !data.indicator) return null
  return {
    id: 'risk-radar',
    chartType: ChartType.RADAR,
    dimensions: data.indicator.map((ind) => ind.name),
    measures: ['value'],
    rawData: data.data.map((d) => ({
      name: d.name,
      ...Object.fromEntries(d.value.map((v, i) => [data.indicator[i].name, v])),
    })),
  }
})

// 业务分布 → ChartData
const businessPieChartData = computed(() => {
  const data = apiBusinessDist.value
  if (!data) return null
  return {
    id: 'business-dist',
    chartType: ChartType.PIE,
    dimensions: ['name'],
    measures: ['value'],
    rawData: data,
  }
})

// 产品销量 → ChartData
const productSalesChartData = computed(() => {
  const data = apiProductSales.value
  if (!data || !data.series) return null
  return {
    id: 'product-sales',
    chartType: ChartType.BAR,
    dimensions: ['product'],
    measures: data.series.map((s) => s.name),
    rawData: data.xAxis.map((x, i) => ({
      product: x,
      ...Object.fromEntries(data.series.map((s) => [s.name, s.data[i]])),
    })),
  }
})

// 客户增长 → ChartData
const customerGrowthChartData = computed(() => {
  const data = apiCustomerGrowth.value
  if (!data || !data.series) return null
  return {
    id: 'customer-growth',
    chartType: ChartType.LINE,
    dimensions: ['month'],
    measures: data.series.map((s) => s.name),
    rawData: data.xAxis.map((x, i) => ({
      month: x,
      ...Object.fromEntries(data.series.map((s) => [s.name, s.data[i]])),
    })),
  }
})

// 分行排名
const branchRankingData = computed(() => {
  const data = apiBranchRanking.value
  if (!data || !data.yAxis) return []
  return data.yAxis.map((label, i) => ({
    label,
    value: data.data[i],
  }))
})

// ============ 数据加载 ============

async function fetchAllData() {
  try {
    const [
      indicators,
      tradeTrend,
      riskRadar,
      businessDist,
      branchRanking,
      productSales,
      customerGrowth,
      tradeHistory,
    ] = await Promise.all([
      api.get('/chart-data/indicators'),
      api.get('/chart-data/trade-trend'),
      api.get('/chart-data/risk-radar'),
      api.get('/chart-data/business-dist'),
      api.get('/chart-data/branch-ranking'),
      api.get('/chart-data/product-sales'),
      api.get('/chart-data/customer-growth'),
      api.get('/trade-history', { params: { page: 1, pageSize: TX_PAGE_SIZE } }),
    ])

    numberCards.value = indicators || []
    apiTradeTrend.value = tradeTrend
    apiRiskRadar.value = riskRadar
    apiBusinessDist.value = businessDist
    apiBranchRanking.value = branchRanking
    apiProductSales.value = productSales
    apiCustomerGrowth.value = customerGrowth

    // 交易流水初始化（page 1）
    if (tradeHistory && tradeHistory.data) {
      apiTransactions.value = tradeHistory.data
      txPage.value = 1
      txHasMore.value = tradeHistory.data.length > 0 && tradeHistory.page < tradeHistory.totalPages
    } else {
      txHasMore.value = false
    }
  } catch (err) {
    console.error('[大屏] 数据加载失败:', err)
    ElMessage.error('数据加载失败，请检查后端服务')
  }
}

// ============ 交互处理 ============

/** 下钻回调 — 点击图表元素时触发 */
function onDrillDown(params) {
  console.log('[大屏] 下钻事件:', params)
  ElMessage.info(`下钻: ${params.name || params.seriesName}`)
}

// ============ 全局刷新 ============

async function handleRefreshAll() {
  // 手动触发 SSE 推送更新
  try {
    await api.post('/sse/trigger-update')
  } catch (e) {
    // 降级：直接拉取 REST API
    await fetchAllData()
  }
  // 重置交易流水自动滚动，展示最新数据
  txListRef.value?.refreshAndReset()
  ElMessage.success('数据已刷新')
}

function toggleFullscreen() {
  appStore.setDataScreenFullscreen(!appStore.dataScreenFullscreen)
}

function handleKeydown(e) {
  if (e.key === 'Escape' && appStore.dataScreenFullscreen) {
    appStore.setDataScreenFullscreen(false)
  }
}

// ============ 生命周期 ============

onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 1000)

  document.addEventListener('keydown', handleKeydown)

  // 初始化 Web Worker
  initWorker()

  // 从后端首次加载
  fetchAllData()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('keydown', handleKeydown)
  appStore.setDataScreenFullscreen(false)
  // 清理 Worker
  if (dataWorker) {
    dataWorker.terminate()
    dataWorker = null
  }
})
</script>

<style lang="scss" scoped>
.screen-display {
  width: 100%;
  height: 100%;
  background: $screen-bg;
  color: $screen-text;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;

  // 修复 DataV 组件尺寸为 0 的问题
  .datav-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

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
  flex-shrink: 0;

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
  flex: 1;
  min-height: 0;
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

// ========== 交易流水行 ==========
.virtual-list-panel {
  padding: 0 !important;
  position: relative; // 让 VirtualList 的 absolute 定位生效
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tx-row {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 12px;
  font-size: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  .tx-col {
    flex-shrink: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tx-id { width: 80px; color: #8899bb; font-family: monospace; }
  .tx-type { width: 60px; color: #c0cee0; }
  .tx-amount { width: 100px; color: #00ff88; font-family: 'DIN Alternate', monospace; text-align: right; }
  .tx-time { width: 70px; color: #8899bb; text-align: center; }
  .tx-status { width: 50px; text-align: right; }
  .tx-ok { color: #00ff88; }
  .tx-pending { color: #ffa940; }
}

.tx-empty {
  text-align: center;
  padding: 40px 0;
  color: #8899bb;
  font-size: 14px;
}

// ========== SSE 状态指示器 ==========
.sse-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
  margin-left: auto;
  transition: background 0.3s;

  &.connected {
    background: #00ff88;
    box-shadow: 0 0 6px rgba(0, 255, 136, 0.5);
  }
}

// ========== 类型筛选下拉框暗色适配 ==========
:deep(.el-select) {
  .el-input__wrapper {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: none;
  }
  .el-input__inner {
    color: #c0cee0;
  }
}
</style>
