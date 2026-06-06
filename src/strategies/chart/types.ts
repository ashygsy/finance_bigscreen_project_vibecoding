import type { EChartsOption, ECharts } from 'echarts'

// 图表唯一标识类型
export type ChartIdentifier = string

// 图表类型枚举
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  RADAR = 'radar',
  SCATTER = 'scatter',
  GAUGE = 'gauge',
  FUNNEL = 'funnel',
  HEATMAP = 'heatmap',
}

// 图表数据协议
export interface ChartData {
  id: ChartIdentifier
  chartType: ChartType
  dimensions: string[] // 维度字段
  measures: string[] // 度量字段
  rawData: Record<string, any>[]
  metadata?: Record<string, any>
}

// 图表交互事件类型
export type ChartInteractionEvent =
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'mouseover'
  | 'mouseout'
  | 'legendselectchanged'
  | 'dataviewchanged'
  | 'datazoom'

// 交互事件参数
export interface InteractionParams {
  event: ChartInteractionEvent
  chartId: ChartIdentifier
  params: any // echarts 原生的 params
  chartInstance: ECharts
}

// 图表策略接口 — 核心！
export interface IChartStrategy {
  /** 策略唯一标识 */
  readonly identifier: ChartIdentifier
  /** 支持的图表类型 */
  readonly chartType: ChartType

  /** 将业务数据转换为 ECharts 配置 */
  transformData(data: ChartData, theme?: 'dark' | 'light'): EChartsOption

  /** 获取默认配置 */
  getDefaultOption(theme?: 'dark' | 'light'): EChartsOption

  /** 处理交互事件 */
  handleInteraction(event: InteractionParams): void

  /** 更新数据（增量合并） */
  updateData(partial: Partial<ChartData>): void

  /** 获取当前数据 */
  getCurrentData(): ChartData | null
}

// 策略工厂注册项
export interface StrategyRegistryItem {
  chartType: ChartType
  strategy: new (id: ChartIdentifier) => IChartStrategy
}
