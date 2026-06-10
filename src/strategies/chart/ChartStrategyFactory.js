import { ChartType } from './types'
import { LineChartStrategy } from './LineChartStrategy'
import { BarChartStrategy } from './BarChartStrategy'
import { PieChartStrategy } from './PieChartStrategy'
import { RadarChartStrategy } from './RadarChartStrategy'
import { ScatterChartStrategy } from './ScatterChartStrategy'
import { GaugeChartStrategy } from './GaugeChartStrategy'

/**
 * 图表策略工厂是一个创建图表策略对象的工具, 作用是: 根据传入的图表类型,自动返回对应的策略实例
 *
 * 使用方式:
 *   const strategy = ChartStrategyFactory.create('myChart', ChartType.LINE)
 *   const option = strategy.transformData(chartData)
 */
//导出类, 其他地方可以导入使用 类名叫图表策略工厂
export class ChartStrategyFactory {
  // 策略注册表, 只属于类本身,挂在工厂上
  /*
    因为挂在工厂上, 实例属性不共享,工厂模式需要共享registry
    registry 存图表类型 ,对应的策略类
  */
  static registry = new Map()

  // 实例缓存 (单例模式，同一 identifier 返回同一实例)
  /*
    存id和对应的实例, 同一种类只存一个图表实例
  */
  static instances = new Map()

  // 静态初始化 — 注册所有策略
  static {
    /*
     *  告诉工程 每种图标类型应该用哪个类创建 ,相当于建立了一个类型 =>类的对照表,方便以后根据类型快速创建对应的策略实例
    */
    ChartStrategyFactory.register(ChartType.LINE, LineChartStrategy)
    ChartStrategyFactory.register(ChartType.BAR, BarChartStrategy)
    ChartStrategyFactory.register(ChartType.PIE, PieChartStrategy)
    ChartStrategyFactory.register(ChartType.RADAR, RadarChartStrategy)
    ChartStrategyFactory.register(ChartType.SCATTER, ScatterChartStrategy)
    ChartStrategyFactory.register(ChartType.GAUGE, GaugeChartStrategy)
    // 后续扩展: AREA, FUNNEL, HEATMAP 等
  }

  /**
   * 注册策略,调用register
   */
  static register(chartType, strategyClass) {
    // 建立类型到 策略的映射, 方便后续根据类型快速创建对应的策略实例
    ChartStrategyFactory.registry.set(chartType, {
      // 图片类型标识和对应的策略类
      chartType,
      strategy: strategyClass,
    })
  }

  /**
   * 创建/获取策略实例 (单例)
   * @param id 图表唯一标识
   * @param chartType 图表类型标识
   */
  //static 静态方法, 通过类名直接调用(chartStrategyFactory.create()), 不需要实例化工厂, 传入id和图表类型, 返回对应的策略实例
  static create(id, chartType) {
    // 已有实例直接返回（单例）
    const existing = ChartStrategyFactory.instances.get(id)
    if (existing) {
      return existing
    }

    const item = ChartStrategyFactory.registry.get(chartType)
    if (!item) {
      throw new Error(`[ChartStrategyFactory] 未注册的图表类型: ${chartType}，可用类型: ${[...ChartStrategyFactory.registry.keys()].join(', ')}`)
    }
    
    // 如果 chartType = 'bar' 等价于const instance = new BarChartStrategy(id)
    const instance = new item.strategy(id)
    // 缓存实例, 后续直接返回
    ChartStrategyFactory.instances.set(id, instance)
    return instance
  }

  /**
   * 根据业务数据自动识别类型并创建策略
   * 可根据数据的 shape 自动推断最佳图表类型
   * 根据选择的数据,自动选择适合的图表类型
   */
  static createFromData(id, data) {
    // 拿到维度和数值指标
    const { dimensions, measures } = data
    let chartType

    if (measures.length >= 3 && dimensions.length >= 3) {
      // 多指标多维度数据, 适合雷达图
      chartType = ChartType.RADAR
    } else if (measures.length === 2 && dimensions.length === 1) {
      // 散点图 2个指标 1个维度
      chartType = ChartType.SCATTER
    } else if (measures.length === 1 && dimensions.length >= 3) {
      // 1个指标 多个维度 使用饼图
      chartType = ChartType.PIE
    } else if (measures.length === 1) {
      // 使用仪表盘图
      chartType = ChartType.GAUGE
    } else if (dimensions.length >= 1) {
      // 使用柱状图
      chartType = ChartType.BAR
    } else {
      // 使用折线图
      chartType = ChartType.LINE
    }

    return ChartStrategyFactory.create(id, chartType)
  }

  /**
   * 获取已注册的所有图表类型
   */
  static getRegisteredTypes() {
    return [...ChartStrategyFactory.registry.keys()]
  }

  /**
   * 销毁指定实例
   */
  static destroy(id) {
    ChartStrategyFactory.instances.delete(id)
  }

  /**
   * 获取实例（不创建）
   */
  static get(id) {
    return ChartStrategyFactory.instances.get(id)
  }

  /**
   * 销毁所有实例
   */
  static destroyAll() {
    ChartStrategyFactory.instances.clear()
  }
}
