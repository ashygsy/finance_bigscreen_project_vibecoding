import { Router } from 'express'
import Indicator from '../models/Indicator.js'
import Screen from '../models/Screen.js'
import Transaction from '../models/Transaction.js'
import User from '../models/User.js'

const router = Router()

/**
 * GET /api/dashboard/stats
 *
 * 工作台首页的 4 个概览统计卡片
 */
router.get('/stats', async (req, res, next) => {
  try {
    const [screenCount, txnCount, userCount] = await Promise.all([
      Screen.countDocuments(),
      Transaction.countDocuments(),
      User.countDocuments(),
    ])

    // 今日交易额（模拟：统计最近 24h 的交易）
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayTxns = await Transaction.find({ time: { $gte: todayStart } }).lean()
    const todayAmount = todayTxns.reduce((sum, t) => sum + t.amount, 0)
    const todayCount = todayTxns.length

    const stats = [
      { label: '大屏总数', value: screenCount, prefix: '', suffix: '个' },
      { label: '报表数量', value: 128, prefix: '', suffix: '份' },
      { label: '今日交易', value: todayCount, prefix: '', suffix: '笔' },
      { label: '活跃用户', value: userCount, prefix: '', suffix: '人' },
    ]

    res.json(stats)
  } catch (err) {
    next(err)
  }
})

export default router
