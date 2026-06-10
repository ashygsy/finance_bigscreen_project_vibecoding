import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import { routes } from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { getSSEManager } from './bff/SSEManager.js'
import { getDataAggregator } from './bff/DataAggregator.js'

const app = express()
const PORT = process.env.PORT || 3100

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api', routes)

// 404 & 错误处理
app.use(notFound)
app.use(errorHandler)

// 启动
async function start() {
  await connectDB()

  // 设置 SSE 数据提供者 — 聚合层提供最新数据
  const sse = getSSEManager()
  const aggregator = getDataAggregator()
  sse.setDataProvider(async () => {
    const data = await aggregator.getAggregatedDashboard()
    return {
      'indicators': data.indicators,
      'trade-trend': data.tradeTrend,
      'business-dist': data.businessDist,
      'risk-radar': data.riskRadar,
      'branch-ranking': data.branchRanking,
      'customer-growth': data.customerGrowth,
      'product-sales': data.productSales,
      'transactions': data.tradeHistory,
    }
  })

  app.listen(PORT, () => {
    console.log(`[Server] 后端服务启动: http://localhost:${PORT}`)
    console.log(`[Server] API 基础路径: http://localhost:${PORT}/api`)
    console.log(`[Server] SSE 端点: http://localhost:${PORT}/api/sse/stream`)
  })
}

start()
