import { Router } from 'express'
import Indicator from '../models/Indicator.js'
import TradeTrend from '../models/TradeTrend.js'
import BusinessDist from '../models/BusinessDist.js'
import BranchRanking from '../models/BranchRanking.js'
import RiskRadar from '../models/RiskRadar.js'
import Transaction from '../models/Transaction.js'
import CustomerGrowth from '../models/CustomerGrowth.js'
import ProductSales from '../models/ProductSales.js'

const router = Router()

/**
 * GET /api/chart-data/:key
 *
 * 通用图表数据接口 — 前端 Pinia Store 的 fetchChartData 默认调用此路径。
 * :key 映射到对应的 MongoDB 集合，返回前端期望的数据格式。
 */
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params

    switch (key) {
      // 指标卡
      case 'indicators': {
        const data = await Indicator.find().sort({ order: 1 }).lean()
        return res.json(data)
      }

      // 交易趋势 → { xAxis: [...], series: [...] }
      case 'trade-trend': {
        const rows = await TradeTrend.find().sort({ time: 1 }).lean()
        const xAxis = rows.map((r) => r.time)
        const series = [
          { name: '转账', data: rows.map((r) => r.transfer) },
          { name: '消费', data: rows.map((r) => r.consumption) },
          { name: '理财', data: rows.map((r) => r.finance) },
        ]
        return res.json({ xAxis, series })
      }

      // 业务分布 → [{ name, value }]
      case 'business-dist': {
        const data = await BusinessDist.find().lean()
        return res.json(data)
      }

      // 分行排名 → { yAxis: [...], data: [...] }
      case 'branch-ranking': {
        const rows = await BranchRanking.find().sort({ performance: -1 }).lean()
        const yAxis = rows.map((r) => r.branch)
        const data = rows.map((r) => r.performance)
        return res.json({ yAxis, data })
      }

      // 风险雷达 → { indicator: [...], data: [...] }
      case 'risk-radar': {
        const rows = await RiskRadar.find().lean()
        const indicator = rows.map((r) => ({ name: r.indicator, max: r.max }))
        const data = [
          { name: '当前', value: rows.map((r) => r.current) },
          { name: '行业均值', value: rows.map((r) => r.industryAvg) },
        ]
        return res.json({ indicator, data })
      }

      // 交易流水 → [{ txId, type, amount, time, status }]
      case 'transactions': {
        const data = await Transaction.find().sort({ time: -1 }).limit(20).lean()
        // 格式化以匹配前端期望
        const formatted = data.map((t) => ({
          id: t.txId,
          type: t.type,
          amount: t.amount.toFixed(2),
          time: t.time.toLocaleTimeString('zh-CN', { hour12: false }),
          status: t.status,
        }))
        return res.json(formatted)
      }

      // 客户增长 → { xAxis: [...], series: [...] }
      case 'customer-growth': {
        const rows = await CustomerGrowth.find().sort({ month: 1 }).lean()
        const xAxis = rows.map((r) => r.month)
        const series = [
          { name: '个人客户(万)', data: rows.map((r) => r.personalCustomers) },
          { name: '企业客户', data: rows.map((r) => r.enterpriseCustomers) },
        ]
        return res.json({ xAxis, series })
      }

      // 产品销量 → { xAxis: [...], series: [...] }
      case 'product-sales': {
        const rows = await ProductSales.find().lean()
        const xAxis = rows.map((r) => r.product)
        const series = [
          { name: '销售量(笔)', type: 'bar', data: rows.map((r) => r.salesVolume) },
          { name: '同比增长(%)', type: 'line', data: rows.map((r) => r.yoyGrowth) },
        ]
        return res.json({ xAxis, series })
      }

      default:
        return res.status(404).json({ error: { message: `未知的图表数据 key: ${key}` } })
    }
  } catch (err) {
    next(err)
  }
})

export default router
