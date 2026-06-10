import Indicator from '../models/Indicator.js'
import TradeTrend from '../models/TradeTrend.js'
import BusinessDist from '../models/BusinessDist.js'
import BranchRanking from '../models/BranchRanking.js'
import RiskRadar from '../models/RiskRadar.js'
import CustomerGrowth from '../models/CustomerGrowth.js'
import ProductSales from '../models/ProductSales.js'
import TickData from '../models/TickData.js'
import TradeHistory from '../models/TradeHistory.js'
import { getPipelineManager } from './PipelineManager.js'
import { getSSEManager } from './SSEManager.js'

/**
 * DataAggregator — BFF 聚合层
 * 合并多个数据源的查询，通过 PipelineManager 控制并发
 */
export class DataAggregator {
  constructor() {
    this.pipeline = getPipelineManager()
  }

  // ============ 聚合仪表盘全量数据 ============

  async getAggregatedDashboard(filters = {}) {
    const pm = this.pipeline
    // 注意: 每个 group 用唯一名称避免 Map key 冲突
    const groups = [
      {
        pipeline: 'aggregation',
        tasks: [
          () => Indicator.find().sort({ order: 1 }).lean(),
          () => TradeTrend.find().sort({ time: 1 }).lean(),
          () => BusinessDist.find().lean(),
          () => RiskRadar.find().lean(),
        ],
      },
      {
        pipeline: 'aggregation',
        tasks: [
          () => BranchRanking.find().sort({ performance: -1 }).lean(),
          () => CustomerGrowth.find().sort({ month: 1 }).lean(),
          () => ProductSales.find().lean(),
        ],
      },
      {
        pipeline: 'transactions',
        tasks: [
          () => TradeHistory.find().sort({ timestamp: -1 }).limit(50).lean(),
          () => TickData.find().sort({ timestamp: -1 }).limit(100).lean(),
        ],
      },
    ]

    const groupResults = await pm.aggregate(groups)

    // groupResults 是 [group0, group1, group2]，每个元素是任务结果数组
    const allResults = groupResults.flat()
    const [indicators, trends, businessDist, riskRadar, branches, customers, products, history, ticks] = allResults

    return {
      indicators,
      tradeTrend: this._formatTradeTrend(trends),
      businessDist,
      riskRadar: this._formatRiskRadar(riskRadar),
      branchRanking: this._formatBranchRanking(branches),
      customerGrowth: this._formatCustomerGrowth(customers),
      productSales: this._formatProductSales(products),
      tradeHistory: this._formatTradeHistory(history),
      tickData: ticks?.slice(0, 500) || [],
    }
  }

  // ============ Tick 数据抽样 ============

  /**
   * LTTB (Largest Triangle Three Buckets) 降采样算法
   * 将大量数据点压缩到指定数量，同时保持视觉特征
   */
  lttbSample(data, threshold) {
    if (!data || data.length <= threshold) return data

    const dataLength = data.length
    if (threshold <= 2) return [data[0], data[dataLength - 1]]

    const sampled = []
    const bucketSize = (dataLength - 2) / (threshold - 2)

    // 第一个点总是保留
    sampled.push(data[0])

    let a = 0 // 上一个锚点索引
    for (let i = 0; i < threshold - 2; i++) {
      const bucketStart = Math.floor((i + 1) * bucketSize) + 1
      const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
      const avgBucketEnd = Math.min(bucketEnd, dataLength - 1)
      const nextBucketStart = Math.min(Math.floor((i + 2) * bucketSize) + 1, dataLength - 1)

      // 计算下一个 bucket 的平均点
      let avgX = 0, avgY = 0
      const nextBucketRange = avgBucketEnd - nextBucketStart + 1
      for (let j = nextBucketStart; j <= avgBucketEnd; j++) {
        avgX += j
        avgY += data[j].price || data[j].value || 0
      }
      avgX /= nextBucketRange
      avgY /= nextBucketRange

      // 在当前 bucket 中找到离锚点和平均点连线最远的点
      let maxArea = -1
      let maxAreaIndex = bucketStart
      const pointA = data[a]
      const ax = a
      const ay = pointA.price || pointA.value || 0

      for (let j = bucketStart; j <= Math.min(bucketEnd, dataLength - 1); j++) {
        const pointJ = data[j]
        const area = Math.abs(
          (ax - avgX) * ((pointJ.price || pointJ.value || 0) - ay) -
          (ax - j) * (avgY - ay)
        )
        if (area > maxArea) {
          maxArea = area
          maxAreaIndex = j
        }
      }

      sampled.push(data[maxAreaIndex])
      a = maxAreaIndex
    }

    // 最后一个点总是保留
    sampled.push(data[dataLength - 1])

    return sampled
  }

  async getSampledTickData({ symbol, startTime, endTime, maxPoints = 200 } = {}) {
    const query = {}
    if (symbol) query.symbol = symbol
    if (startTime || endTime) {
      query.timestamp = {}
      if (startTime) query.timestamp.$gte = new Date(startTime)
      if (endTime) query.timestamp.$lte = new Date(endTime)
    }

    const raw = await TickData.find(query).sort({ timestamp: 1 }).lean()
    const sampled = this.lttbSample(raw, maxPoints)

    return {
      symbol: symbol || 'all',
      rawCount: raw.length,
      sampledCount: sampled.length,
      maxPoints,
      data: sampled,
    }
  }

  // ============ 交易历史分页查询 ============

  async queryTradeHistory({ page = 1, pageSize = 50, filters = {}, sort = { timestamp: -1 } } = {}) {
    const query = this._buildTradeHistoryQuery(filters)
    const skip = (page - 1) * pageSize

    const [total, rows] = await Promise.all([
      TradeHistory.countDocuments(query),
      TradeHistory.find(query).sort(sort).skip(skip).limit(pageSize).lean(),
    ])

    return {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: this._formatTradeHistory(rows),
    }
  }

  // ============ 辅助格式化方法 ============

  _formatTradeTrend(rows) {
    if (!rows || rows.length === 0) return { xAxis: [], series: [] }
    return {
      xAxis: rows.map((r) => r.time),
      series: [
        { name: '转账', data: rows.map((r) => r.transfer) },
        { name: '消费', data: rows.map((r) => r.consumption) },
        { name: '理财', data: rows.map((r) => r.finance) },
      ],
    }
  }

  _formatRiskRadar(rows) {
    if (!rows || rows.length === 0) return { indicator: [], data: [] }
    return {
      indicator: rows.map((r) => ({ name: r.indicator, max: r.max })),
      data: [
        { name: '当前', value: rows.map((r) => r.current) },
        { name: '行业均值', value: rows.map((r) => r.industryAvg) },
      ],
    }
  }

  _formatBranchRanking(rows) {
    if (!rows) return { yAxis: [], data: [] }
    return {
      yAxis: rows.map((r) => r.branch),
      data: rows.map((r) => r.performance),
    }
  }

  _formatCustomerGrowth(rows) {
    if (!rows || rows.length === 0) return { xAxis: [], series: [] }
    return {
      xAxis: rows.map((r) => r.month),
      series: [
        { name: '个人客户(万)', data: rows.map((r) => r.personalCustomers) },
        { name: '企业客户', data: rows.map((r) => r.enterpriseCustomers) },
      ],
    }
  }

  _formatProductSales(rows) {
    if (!rows || rows.length === 0) return { xAxis: [], series: [] }
    return {
      xAxis: rows.map((r) => r.product),
      series: [
        { name: '销售量(笔)', type: 'bar', data: rows.map((r) => r.salesVolume) },
        { name: '同比增长(%)', type: 'line', data: rows.map((r) => r.yoyGrowth) },
      ],
    }
  }

  _formatTradeHistory(rows) {
    if (!rows) return []
    return rows.map((t) => ({
      id: t.txId,
      type: t.type,
      amount: t.amount.toFixed(2),
      time: t.timestamp?.toLocaleTimeString?.('zh-CN', { hour12: false }) || t.timestamp,
      status: t.status,
      channel: t.channel,
      customerName: t.customerName,
    }))
  }

  _buildTradeHistoryQuery(filters) {
    const q = {}
    if (filters.type) q.type = filters.type
    if (filters.status) q.status = filters.status
    if (filters.channel) q.channel = filters.channel
    if (filters.branch) q.branch = filters.branch
    if (filters.customerType) q.customerType = filters.customerType
    if (filters.minAmount || filters.maxAmount) {
      q.amount = {}
      if (filters.minAmount) q.amount.$gte = parseFloat(filters.minAmount)
      if (filters.maxAmount) q.amount.$lte = parseFloat(filters.maxAmount)
    }
    if (filters.startTime || filters.endTime) {
      q.timestamp = {}
      if (filters.startTime) q.timestamp.$gte = new Date(filters.startTime)
      if (filters.endTime) q.timestamp.$lte = new Date(filters.endTime)
    }
    return q
  }
}

// 单例
let instance = null
export function getDataAggregator() {
  if (!instance) {
    instance = new DataAggregator()
  }
  return instance
}
