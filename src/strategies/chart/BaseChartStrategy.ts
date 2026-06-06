import type {
  IChartStrategy,
  ChartData,
  ChartIdentifier,
  ChartType,
  InteractionParams,
} from './types'

/**
 * 图表策略抽象基类
 * — 封装统一交互行为（模板方法模式）
 * — 子类只需实现 transformData 和 getDefaultOption
 */
export abstract class BaseChartStrategy implements IChartStrategy {
  readonly identifier: ChartIdentifier
  abstract readonly chartType: ChartType

  protected currentData: ChartData | null = null
  protected interactionHandlers: Map<string, (params: InteractionParams) => void> = new Map()

  constructor(id: ChartIdentifier) {
    this.identifier = id
    this.setupDefaultInteractions()
  }

  // ============ 抽象方法 — 子类必须实现 ============

  /** 将业务数据转换为 ECharts 配置 */
  abstract transformData(data: ChartData, theme?: 'dark' | 'light'): import('echarts').EChartsOption

  /** 获取默认的可视化配置 */
  abstract getDefaultOption(theme?: 'dark' | 'light'): import('echarts').EChartsOption

  // ============ 统一交互行为 — 所有图表共用 ============

  /**
   * 统一交互入口
   * 所有图表的 click、hover、zoom 等事件统一由此方法分发
   */
  handleInteraction(event: InteractionParams): void {
    // 1. 记录交互埋点
    this.trackInteraction(event)

    // 2. 执行默认交互行为
    this.defaultClickBehavior(event)
    this.defaultHoverBehavior(event)
    this.defaultZoomBehavior(event)

    // 3. 执行自定义处理器
    const handler = this.interactionHandlers.get(event.event)
    if (handler) {
      handler(event)
    }
  }

  /** 注册自定义交互处理器 */
  on(event: string, handler: (params: InteractionParams) => void): this {
    this.interactionHandlers.set(event, handler)
    return this
  }

  /** 移除交互处理器 */
  off(event: string): this {
    this.interactionHandlers.delete(event)
    return this
  }

  // ============ 数据管理 ============

  updateData(partial: Partial<ChartData>): void {
    if (this.currentData) {
      this.currentData = { ...this.currentData, ...partial }
    }
  }

  getCurrentData(): ChartData | null {
    return this.currentData
  }

  setData(data: ChartData): void {
    this.currentData = data
  }

  // ============ 受保护的钩子方法 ============

  /** 生成图表唯一 DOM ID */
  protected getDomId(): string {
    return `chart_${this.identifier}`
  }

  /** 获取统一 tooltip 配置 */
  protected getUnifiedTooltip(): Record<string, any> {
    return {
      trigger: 'axis',
      backgroundColor: 'rgba(6, 30, 93, 0.9)',
      borderColor: 'rgba(0, 168, 255, 0.3)',
      textStyle: { color: '#e0e6f0', fontSize: 13 },
      axisPointer: {
        type: 'cross',
        crossStyle: { color: '#8899bb' },
      },
    }
  }

  /** 获取统一动画配置 */
  protected getUnifiedAnimation(): Record<string, any> {
    return {
      animation: true,
      animationDuration: 600,
      animationEasing: 'cubicOut',
    }
  }

  // ============ 私有方法 ============

  private setupDefaultInteractions(): void {
    // 预注册默认交互钩子
    this.interactionHandlers.set('click', this.defaultClickBehavior.bind(this))
  }

  private defaultClickBehavior(event: InteractionParams): void {
    // 默认点击行为：高亮 + 联动通知
    // 由 composable 层通过 provide/inject 实现跨组件通信
    const { params } = event
    if (params.componentType === 'series') {
      console.log(`[Chart:${this.identifier}] 点击了:`, params.name, params.value)
    }
  }

  private defaultHoverBehavior(event: InteractionParams): void {
    // 默认 hover: tooltip 高亮（echarts 原生支持，这里做扩展预留）
  }

  private defaultZoomBehavior(event: InteractionParams): void {
    // 默认 zoom: datazoom 触发时通知联动
    if (event.event === 'datazoom') {
      console.log(`[Chart:${this.identifier}] 缩放:`, event.params)
    }
  }

  private trackInteraction(event: InteractionParams): void {
    // 交互埋点，统一记录用户行为
    const payload = {
      chartId: this.identifier,
      chartType: this.chartType,
      event: event.event,
      timestamp: Date.now(),
    }
    // 后续可接入埋点 SDK
    console.debug('[ChartTrack]', payload)
  }
}
