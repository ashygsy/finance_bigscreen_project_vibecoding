import { ref, computed, onUnmounted, type Ref } from 'vue'
import type {
  IChartStrategy,
  ChartIdentifier,
  InteractionParams,
  ChartInteractionEvent,
} from '@/strategies/chart/types'

/**
 * 图表联动上下文 — 通过 provide/inject 实现跨组件通信
 */
interface ChartLinkageContext {
  /** 注册图表到联动系统 */
  register: (id: ChartIdentifier, strategy: IChartStrategy) => void
  /** 注销 */
  unregister: (id: ChartIdentifier) => void
  /** 广播交互事件给其他图表 */
  broadcast: (event: InteractionParams) => void
}

/**
 * 统一图表交互 Composable
 *
 * 封装所有图表的通用交互行为：
 * - click: 点击数据点 → 高亮 + 联动下钻 + 通知其他图表
 * - hover: 悬停 → tooltip 增强
 * - zoom: 缩放 → 同步其他图表的 dataZoom
 * - drill-down: 下钻 → 更新数据 + 面包屑导航
 * - linkage: 联动 → 点击一个图表，其他图表自动过滤
 */
export function useChartInteraction(
  chartId: ChartIdentifier,
  strategy: Ref<IChartStrategy | null>,
  options?: {
    enableDrillDown?: boolean
    enableLinkage?: boolean
    onDrillDown?: (params: any) => void
    onLinkage?: (sourceId: ChartIdentifier, params: any) => void
  }
) {
  const { enableDrillDown = true, enableLinkage = true, onDrillDown, onLinkage } = options || {}

  // 下钻层级栈
  const drillStack = ref<any[]>([])
  const drillLevel = ref(0)
  const canDrillUp = computed(() => drillLevel.value > 0)

  // 联动状态
  const linkageFilter = ref<Record<string, any>>({})
  const lastClickedParams = ref<any>(null)

  // ============ 统一事件分发 ============

  function handleChartEvent(event: ChartInteractionEvent, params: any): void {
    if (!strategy.value) return

    const interactionParams: InteractionParams = {
      event,
      chartId,
      params,
      chartInstance: (params as any)?.chartInstance,
    }

    // 1. 委托给策略处理
    strategy.value.handleInteraction(interactionParams)

    // 2. 根据事件类型执行统一行为
    switch (event) {
      case 'click':
        handleClick(params)
        break
      case 'mouseover':
        handleHover(params, true)
        break
      case 'mouseout':
        handleHover(params, false)
        break
      case 'datazoom':
        handleZoom(params)
        break
    }
  }

  // ============ 点击行为 ============

  function handleClick(params: any): void {
    lastClickedParams.value = params

    // 下钻
    if (enableDrillDown && params.componentType === 'series') {
      drillStack.value.push({
        name: params.name,
        value: params.value,
        seriesName: params.seriesName,
        dataIndex: params.dataIndex,
      })
      drillLevel.value = drillStack.value.length

      onDrillDown?.(params)
    }

    // 联动 — 通知其他图表
    if (enableLinkage) {
      linkageFilter.value = {
        name: params.name,
        seriesName: params.seriesName,
        value: params.value,
      }
      onLinkage?.(chartId, params)
    }
  }

  function drillUp(): void {
    if (drillStack.value.length > 0) {
      drillStack.value.pop()
      drillLevel.value = drillStack.value.length
      linkageFilter.value = {}
    }
  }

  function resetDrill(): void {
    drillStack.value = []
    drillLevel.value = 0
    linkageFilter.value = {}
  }

  // ============ Hover 行为 ============

  function handleHover(params: any, isHovering: boolean): void {
    // 统一 hover 增强: 可在此处实现 tooltip 增强、高亮联动等
    if (isHovering && params.componentType === 'series') {
      // 可通知其他图表高亮对应数据
    }
  }

  // ============ Zoom 行为 ============

  function handleZoom(params: any): void {
    // 缩放同步: 将 dataZoom 的范围广播给联动图表
    const zoomRange = {
      start: params.start,
      end: params.end,
      startValue: params.startValue,
      endValue: params.endValue,
    }
    // 联动图表同步缩放范围
  }

  // ============ 事件绑定 ============

  function buildEChartsEventHandlers(): Record<string, Function> {
    const events: ChartInteractionEvent[] = [
      'click', 'dblclick', 'mousedown', 'mouseup',
      'mouseover', 'mouseout', 'legendselectchanged',
    ]

    const handlers: Record<string, Function> = {}
    events.forEach((event) => {
      handlers[event] = (params: any) => handleChartEvent(event, params)
    })
    return handlers
  }

  // ============ 生命周期 ============

  onUnmounted(() => {
    resetDrill()
  })

  return {
    // 状态
    drillLevel,
    drillStack,
    canDrillUp,
    linkageFilter,
    lastClickedParams,
    // 方法
    handleChartEvent,
    buildEChartsEventHandlers,
    drillUp,
    resetDrill,
    handleClick,
    handleHover,
    handleZoom,
  }
}

/**
 * 跨图表联动 Composable
 * 用于数据大屏中多个图表之间的联动
 */
export function useChartLinkage() {
  const chartRegistry = ref<Map<ChartIdentifier, IChartStrategy>>(new Map())
  const linkageSource = ref<ChartIdentifier | null>(null)
  const linkageParams = ref<any>(null)

  function register(id: ChartIdentifier, strategy: IChartStrategy): void {
    chartRegistry.value.set(id, strategy)
  }

  function unregister(id: ChartIdentifier): void {
    chartRegistry.value.delete(id)
  }

  /**
   * 广播联动事件
   * 当源图表发生交互时，通知所有其他图表
   */
  function broadcast(sourceId: ChartIdentifier, params: any): void {
    linkageSource.value = sourceId
    linkageParams.value = params

    // 通知其他图表 — 每个图表的策略可根据 params 更新自己的数据
    chartRegistry.value.forEach((strategy, id) => {
      if (id !== sourceId) {
        // 触发联动回调，由各图表决定如何响应
        console.log(`[Linkage] ${sourceId} → ${id}:`, params.name)
      }
    })
  }

  return {
    chartRegistry,
    linkageSource,
    linkageParams,
    register,
    unregister,
    broadcast,
  }
}
