import { Router } from 'express'
import { getSSEManager } from '../bff/SSEManager.js'
import { getDataAggregator } from '../bff/DataAggregator.js'

const router = Router()

// ============ SSE 流端点 ============

/**
 * GET /api/sse/stream?types=indicators,trade-trend,transactions
 *
 * 客户端通过 EventSource 连接，接收服务端主动推送的数据更新。
 * types 参数可选，用于过滤接收的事件类型。
 */
router.get('/sse/stream', (req, res) => {
  const types = req.query.types ? req.query.types.split(',') : ['*']
  const clientId = req.query.clientId || null
  const sse = getSSEManager()

  // 确保自动推送已启动
  sse.startAutoPush(5000)

  const id = sse.addClient(clientId, res, types)
  console.log(`[SSE] 客户端连接: ${id}, 订阅: ${types.join(',')}`)
})

/**
 * POST /api/sse/trigger-update
 *
 * 手动触发一次 SSE 数据推送（例如刷新按钮调用）
 */
router.post('/sse/trigger-update', async (req, res) => {
  try {
    const sse = getSSEManager()
    if (!sse.dataProvider) {
      return res.json({ error: { message: 'SSE dataProvider 未设置' } })
    }
    const dataMap = await sse.dataProvider()
    Object.entries(dataMap).forEach(([event, data]) => {
      sse.broadcast(event, data)
    })
    res.json({ message: '推送完成', events: Object.keys(dataMap).length })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
})

/**
 * GET /api/sse/stats
 */
router.get('/sse/stats', (req, res) => {
  const sse = getSSEManager()
  res.json(sse.getStats())
})

// ============ 聚合仪表盘数据 ============

/**
 * GET /api/aggregated/dashboard
 *
 * 通过 PipelineManager 并发查询所有图表数据并聚合返回
 */
router.get('/aggregated/dashboard', async (req, res, next) => {
  try {
    const aggregator = getDataAggregator()
    const data = await aggregator.getAggregatedDashboard()
    res.json(data)
  } catch (err) {
    next(err)
  }
})

// ============ Tick 数据抽样 ============

/**
 * GET /api/tick-data?symbol=EURUSD&maxPoints=200&start=&end=
 */
router.get('/tick-data', async (req, res, next) => {
  try {
    const { symbol, startTime, endTime, maxPoints } = req.query
    const aggregator = getDataAggregator()
    const result = await aggregator.getSampledTickData({
      symbol,
      startTime,
      endTime,
      maxPoints: parseInt(maxPoints) || 200,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// ============ 交易历史分页 ============

/**
 * GET /api/trade-history?page=1&pageSize=50&type=转账&channel=手机银行&status=success
 */
router.get('/trade-history', async (req, res, next) => {
  try {
    const { page, pageSize, ...filters } = req.query
    const aggregator = getDataAggregator()
    const result = await aggregator.queryTradeHistory({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 50,
      filters,
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
