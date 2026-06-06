import type { IChartStrategy, ChartIdentifier, StrategyRegistryItem } from './types'
import { ChartType } from './types'
import { LineChartStrategy } from './LineChartStrategy'
import { BarChartStrategy } from './BarChartStrategy'
import { PieChartStrategy } from './PieChartStrategy'
import { RadarChartStrategy } from './RadarChartStrategy'
import { ScatterChartStrategy } from './ScatterChartStrategy'
import { GaugeChartStrategy } from './GaugeChartStrategy'

/**
 * 图表策略工厂 — 根据 chartType 标识自动生成对应策略实例
 *
 * 使用方式:
 *   const strategy = ChartStrategyFactory.create('myChart', ChartType.LINE)
 *   const option = strategy.transformData(chartData)
 */
export class ChartStrategyFactory {
  // 策略注册表
  private static registry: Map<ChartType, StrategyRegistryItem> = new Map()

  // 实例缓存 (单例模式，同一 identifier 返回同一实例)
  private static instances: Map<ChartIdentifier, IChartStrategy> = new Map()

  // 静态初始化 — 注册所有策略
  static {
    ChartStrategyFactory.register(ChartType.LINE, LineChartStrategy)
    ChartStrategyFactory.register(ChartType.BAR, BarChartStrategy)
    ChartStrategyFactory.register(ChartType.PIE, PieChartStrategy)
    ChartStrategyFactory.register(ChartType.RADAR, RadarChartStrategy)
    ChartStrategyFactory.register(ChartType.SCATTER, ScatterChartStrategy)
    ChartStrategyFactory.register(ChartType.GAUGE, GaugeChartStrategy)
    // 后续扩展: AREA, FUNNEL, HEATMAP 等
  }

  /**
   * 注册策略
   */
  static register(chartType: ChartType, strategyClass: new (id: ChartIdentifier) => IChartStrategy): void {
    ChartStrategyFactory.registry.set(chartType, {
      chartType,
      strategy: strategyClass,
    })
  }

  /**
   * 创建/获取策略实例 (单例)
   * @param id 图表唯一标识
   * @param chartType 图表类型标识
   */
  static create(id: ChartIdentifier, chartType: ChartType): IChartStrategy {
    // 已有实例直接返回（单例）
    const existing = ChartStrategyFactory.instances.get(id)
    if (existing) {
      return existing
    }

    const item = ChartStrategyFactory.registry.get(chartType)
    if (!item) {
      throw new Error(`[ChartStrategyFactory] 未注册的图表类型: ${chartType}，可用类型: ${[...ChartStrategyFactory.registry.keys()].join(', ')}`)
    }

    const instance = new item.strategy(id)
    ChartStrategyFactory.instances.set(id, instance)
    return instance
  }

  /**
   * 根据业务数据自动识别类型并创建策略
   * 可根据数据的 shape 自动推断最佳图表类型
   */
  static createFromData(id: ChartIdentifier, data: { dimensions: string[]; measures: string[] }): IChartStrategy {
    const { dimensions, measures } = data
    let chartType: ChartType

    if (measures.length >= 3 && dimensions.length >= 3) {
      chartType = ChartType.RADAR
    } else if (measures.length === 2 && dimensions.length === 1) {
      chartType = ChartType.SCATTER
    } else if (measures.length === 1 && dimensions.length >= 3) {
      chartType = ChartType.PIE
    } else if (measures.length === 1) {
      chartType = ChartType.GAUGE
    } else if (dimensions.length >= 1) {
      chartType = ChartType.BAR
    } else {
      chartType = ChartType.LINE
    }

    return ChartStrategyFactory.create(id, chartType)
  }

  /**
   * 获取已注册的所有图表类型
   */
  static getRegisteredTypes(): ChartType[] {
    return [...ChartStrategyFactory.registry.keys()]
  }

  /**
   * 销毁指定实例
   */
  static destroy(id: ChartIdentifier): void {
    ChartStrategyFactory.instances.delete(id)
  }

  /**
   * 获取实例（不创建）
   */
  static get(id: ChartIdentifier): IChartStrategy | undefined {
    return ChartStrategyFactory.instances.get(id)
  }

  /**
   * 销毁所有实例
   */
  static destroyAll(): void {
    ChartStrategyFactory.instances.clear()
  }
}
