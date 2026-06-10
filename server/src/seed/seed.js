import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

// 模型
import Indicator from '../models/Indicator.js'
import TradeTrend from '../models/TradeTrend.js'
import BusinessDist from '../models/BusinessDist.js'
import BranchRanking from '../models/BranchRanking.js'
import RiskRadar from '../models/RiskRadar.js'
import Transaction from '../models/Transaction.js'
import CustomerGrowth from '../models/CustomerGrowth.js'
import ProductSales from '../models/ProductSales.js'
import Screen from '../models/Screen.js'
import User from '../models/User.js'
import TickData from '../models/TickData.js'
import TradeHistory from '../models/TradeHistory.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_data'

// ============ 种子数据 ============

// 指标卡数据 — 参考商业银行真实指标数量级
const indicators = [
  { title: '总资产规模', value: 5285.36, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 12.5, color: '#00d4ff', order: 1 },
  { title: '今日交易额', value: 216.82, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 8.3, color: '#00ff88', order: 2 },
  { title: '活跃客户数', value: 48623, suffix: '户', trend: 'up', trendValue: 5.7, color: '#ffa940', order: 3 },
  { title: '不良贷款率', value: 1.52, suffix: '%', trend: 'down', trendValue: 0.3, color: '#ff4d4f', order: 4 },
  { title: '理财产品规模', value: 492.18, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 15.2, color: '#9254de', order: 5 },
  { title: '本月营收', value: 13.65, prefix: '¥', suffix: '亿', trend: 'up', trendValue: 9.8, color: '#36cfc9', order: 6 },
]

// 交易趋势 — 24小时日内波动（模拟银行交易时段分布）
const timeSlots = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
const tradeTrends = timeSlots.map((time, i) => {
  // 模拟交易活跃度曲线：凌晨低，上午攀升，午后高峰，晚间回落
  const hour = i
  let activityFactor = 1
  if (hour >= 0 && hour < 6) activityFactor = 0.15 + hour * 0.05       // 凌晨低谷
  else if (hour >= 6 && hour < 9) activityFactor = 0.5 + (hour - 6) * 0.3 // 早间攀升
  else if (hour >= 9 && hour < 12) activityFactor = 1.2 + (hour - 9) * 0.15 // 上午高峰
  else if (hour >= 12 && hour < 14) activityFactor = 1.0 + (hour - 12) * 0.1  // 午后
  else if (hour >= 14 && hour < 17) activityFactor = 1.3 + (hour - 14) * 0.05 // 下午高峰
  else activityFactor = 1.2 - (hour - 17) * 0.15                     // 晚间回落

  const baseTransfer = 3800
  const baseConsumption = 2200
  const baseFinance = 1200

  // 添加 ±15% 的随机波动
  const jitter = () => 0.85 + Math.random() * 0.3
  return {
    time,
    transfer: Math.round(baseTransfer * activityFactor * jitter()),
    consumption: Math.round(baseConsumption * activityFactor * jitter()),
    finance: Math.round(baseFinance * activityFactor * jitter()),
  }
})

// 业务分布 — 银行业务板块规模（亿元）
const businessDist = [
  { name: '个人储蓄', value: 1820 },
  { name: '企业贷款', value: 1450 },
  { name: '消费金融', value: 890 },
  { name: '财富管理', value: 720 },
  { name: '支付结算', value: 560 },
  { name: '国际业务', value: 380 },
  { name: '同业业务', value: 265 },
  { name: '投资银行', value: 195 },
]

// 分行业绩排名 — 全国主要分行（亿元/年）
const branchRanking = [
  { branch: '北京分行', performance: 428 },
  { branch: '上海分行', performance: 396 },
  { branch: '深圳分行', performance: 385 },
  { branch: '广州分行', performance: 352 },
  { branch: '杭州分行', performance: 318 },
  { branch: '成都分行', performance: 289 },
  { branch: '南京分行', performance: 267 },
  { branch: '武汉分行', performance: 245 },
  { branch: '苏州分行', performance: 228 },
  { branch: '青岛分行', performance: 205 },
  { branch: '西安分行', performance: 186 },
  { branch: '长沙分行', performance: 172 },
]

// 风险指标 — 6 维度雷达图（当前值 vs 行业均值）
const riskRadar = [
  { indicator: '信用风险', max: 100, current: 42, industryAvg: 55 },
  { indicator: '市场风险', max: 100, current: 55, industryAvg: 60 },
  { indicator: '操作风险', max: 100, current: 38, industryAvg: 48 },
  { indicator: '流动性风险', max: 100, current: 45, industryAvg: 50 },
  { indicator: '合规风险', max: 100, current: 32, industryAvg: 42 },
  { indicator: '声誉风险', max: 100, current: 28, industryAvg: 40 },
]

// 交易流水 — 50 条模拟实时交易
const txTypes = ['转账', '消费', '理财申购', '贷款放款', '信用卡还款']
const txStatuses = ['success', 'success', 'success', 'success', 'success', 'success', 'success', 'pending'] // 约 87.5% 成功率
const transactions = Array.from({ length: 50 }, (_, i) => ({
  txId: `TX${String(i + 1).padStart(6, '0')}`,
  type: txTypes[i % 5],
  amount: parseFloat((Math.random() * 950000 + 50000).toFixed(2)),
  time: new Date(Date.now() - i * 180000), // 每条间隔 3 分钟
  status: txStatuses[Math.floor(Math.random() * txStatuses.length)],
}))

// 客户增长趋势 — 12 个月
const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const personalBase = 320         // 万
const enterpriseBase = 8200      // 户
const customerGrowth = months.map((month, i) => ({
  month,
  personalCustomers: parseFloat((personalBase + i * 14.2 + (Math.random() - 0.5) * 3).toFixed(1)),
  enterpriseCustomers: Math.round(enterpriseBase + i * 385 + (Math.random() - 0.5) * 80),
}))

// 产品销量 — 7 类金融产品
const productSales = [
  { product: '基金', salesVolume: 12500, yoyGrowth: 15 },
  { product: '保险', salesVolume: 9800, yoyGrowth: 8 },
  { product: '理财产品', salesVolume: 15200, yoyGrowth: 22 },
  { product: '债券', salesVolume: 8400, yoyGrowth: 5 },
  { product: '信托计划', salesVolume: 6200, yoyGrowth: 12 },
  { product: '外汇', salesVolume: 4800, yoyGrowth: -3 },
  { product: '黄金', salesVolume: 7600, yoyGrowth: 18 },
]

// 大屏模板
const screens = [
  {
    title: '经营总览大屏',
    description: '核心经营指标实时监控，涵盖资产规模、交易趋势、分行业绩、风险评级',
    thumbnail: '',
    theme: 'dark',
    widgets: [],
  },
  {
    title: '风险监控大屏',
    description: '风控指标与预警，实时监控信用风险、市场风险、操作风险等核心维度',
    thumbnail: '',
    theme: 'dark',
    widgets: [],
  },
  {
    title: '营销分析大屏',
    description: '营销活动效果分析，追踪客户增长、产品销量、业务分布等关键指标',
    thumbnail: '',
    theme: 'dark',
    widgets: [],
  },
]

// 用户（密码统一为 123456）
const users = [
  { username: 'admin', password: '123456', role: 'admin' },
  { username: 'analyst', password: '123456', role: 'analyst' },
  { username: 'viewer', password: '123456', role: 'viewer' },
]

// ============ 高频交易 Tick 数据 (100,000 条) ============

const SYMBOLS = ['EURUSD', 'XAUUSD', 'BTCUSD', 'USDJPY', 'GBPUSD']
const SYMBOL_BASE_PRICES = { EURUSD: 1.0850, XAUUSD: 1950.0, BTCUSD: 68000.0, USDJPY: 151.50, GBPUSD: 1.2650 }
const SYMBOL_VOLATILITY = { EURUSD: 0.0003, XAUUSD: 1.5, BTCUSD: 200.0, USDJPY: 0.08, GBPUSD: 0.0005 }

/** 生成随机游走价格序列 */
function generateTickData(symbol, count, startDate) {
  const ticks = []
  let price = SYMBOL_BASE_PRICES[symbol]
  const vol = SYMBOL_VOLATILITY[symbol]
  const sides = ['buy', 'sell']
  const types = ['market', 'market', 'market', 'limit'] // 75% market, 25% limit

  for (let i = 0; i < count; i++) {
    // 随机游走 + 均值回归
    const drift = (SYMBOL_BASE_PRICES[symbol] - price) * 0.0001
    const noise = (Math.random() - 0.5) * vol
    price = +(price + drift + noise).toFixed(symbol === 'BTCUSD' ? 2 : symbol.includes('JPY') ? 3 : 5)

    ticks.push({
      symbol,
      price: Math.max(price, SYMBOL_BASE_PRICES[symbol] * 0.85),
      volume: +(Math.random() * 10 + 0.01).toFixed(2),
      side: sides[Math.floor(Math.random() * 2)],
      type: types[Math.floor(Math.random() * types.length)],
      timestamp: new Date(startDate.getTime() + i * (86400000 / count)), // 均匀分布在 24h
    })
  }
  return ticks
}

// ============ 交易历史明细 (50,000 条) ============

const TX_TYPES = ['转账', '消费', '理财申购', '贷款放款', '信用卡还款']
const TX_CHANNELS = ['手机银行', '网银', '柜台', 'ATM', 'POS']
const TX_BRANCHES = ['北京分行', '上海分行', '深圳分行', '广州分行', '杭州分行', '成都分行', '南京分行', '武汉分行', '苏州分行', '青岛分行']
const TX_CUSTOMER_TYPES = ['personal', 'personal', 'personal', 'enterprise', 'institution'] // 60% 个人
const TX_STATUSES = ['success', 'success', 'success', 'success', 'success', 'success', 'success', 'pending', 'failed'] // ~78% success
const TX_CURRENCIES = ['CNY', 'CNY', 'CNY', 'CNY', 'CNY', 'CNY', 'USD', 'EUR'] // 主要 CNY
const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何']
const GIVENNAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋', '勇', '艳', '杰', '军', '涛', '明', '超', '华']

function generateTradeHistory(count, startDate) {
  const records = []
  for (let i = 0; i < count; i++) {
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)]
    const given = GIVENNAMES[Math.floor(Math.random() * GIVENNAMES.length)]
    const customerType = TX_CUSTOMER_TYPES[Math.floor(Math.random() * TX_CUSTOMER_TYPES.length)]
    const name = customerType === 'personal'
      ? `${surname}${given}`
      : `${surname}${given}${customerType === 'enterprise' ? '公司' : '资本'}`

    const baseAmount = customerType === 'institution' ? 5000000 : customerType === 'enterprise' ? 500000 : 10000
    const amount = +(baseAmount * (0.1 + Math.random() * 20)).toFixed(2)

    records.push({
      txId: `TX${String(i + 1).padStart(7, '0')}`,
      customerName: name,
      customerType,
      amount,
      type: TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)],
      channel: TX_CHANNELS[Math.floor(Math.random() * TX_CHANNELS.length)],
      branch: TX_BRANCHES[Math.floor(Math.random() * TX_BRANCHES.length)],
      currency: TX_CURRENCIES[Math.floor(Math.random() * TX_CURRENCIES.length)],
      status: TX_STATUSES[Math.floor(Math.random() * TX_STATUSES.length)],
      timestamp: new Date(startDate.getTime() - Math.floor(Math.random() * 90 * 86400000)), // 最近90天
    })

    // 每 10K 条输出进度
    if ((i + 1) % 10000 === 0) {
      console.log(`  [TradeHistory] 已生成 ${i + 1}/${count}...`)
    }
  }
  return records
}

// ============ 主函数 ============

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('[Seed] 已连接 MongoDB:', MONGODB_URI)

    // 清理旧数据
    const collections = await mongoose.connection.db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)
    for (const name of collectionNames) {
      await mongoose.connection.db.dropCollection(name)
      console.log(`[Seed] 已清空集合: ${name}`)
    }

    // 批量写入
    await Indicator.insertMany(indicators)
    console.log(`[Seed] 指标卡: ${indicators.length} 条`)

    await TradeTrend.insertMany(tradeTrends)
    console.log(`[Seed] 交易趋势: ${tradeTrends.length} 条`)

    await BusinessDist.insertMany(businessDist)
    console.log(`[Seed] 业务分布: ${businessDist.length} 条`)

    await BranchRanking.insertMany(branchRanking)
    console.log(`[Seed] 分行排名: ${branchRanking.length} 条`)

    await RiskRadar.insertMany(riskRadar)
    console.log(`[Seed] 风险雷达: ${riskRadar.length} 条`)

    await Transaction.insertMany(transactions)
    console.log(`[Seed] 交易流水: ${transactions.length} 条`)

    await CustomerGrowth.insertMany(customerGrowth)
    console.log(`[Seed] 客户增长: ${customerGrowth.length} 条`)

    await ProductSales.insertMany(productSales)
    console.log(`[Seed] 产品销量: ${productSales.length} 条`)

    await Screen.insertMany(screens)
    console.log(`[Seed] 大屏模板: ${screens.length} 条`)

    // 用户密码哈希
    const salt = await bcrypt.genSalt(10)
    const hashedUsers = await Promise.all(
      users.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, salt),
      }))
    )
    await User.insertMany(hashedUsers)
    console.log(`[Seed] 用户: ${hashedUsers.length} 条 (密码: 123456)`)

    // ---- 数据密集型数据集 ----
    const now = new Date()

    // TickData: 5 品种 × 20,000 条 = 100,000 条
    console.log('[Seed] 正在生成高频交易 Tick 数据 (100,000 条)...')
    let tickTotal = 0
    for (const symbol of SYMBOLS) {
      const ticks = generateTickData(symbol, 20000, now)
      // 分批写入，每批 5000
      for (let i = 0; i < ticks.length; i += 5000) {
        await TickData.insertMany(ticks.slice(i, i + 5000))
      }
      tickTotal += ticks.length
      console.log(`  [TickData] ${symbol}: ${ticks.length} 条`)
    }
    console.log(`[Seed] 高频交易 Tick 数据: ${tickTotal} 条`)

    // TradeHistory: 50,000 条
    console.log('[Seed] 正在生成交易历史明细 (50,000 条)...')
    const tradeHistory = generateTradeHistory(50000, now)
    for (let i = 0; i < tradeHistory.length; i += 5000) {
      await TradeHistory.insertMany(tradeHistory.slice(i, i + 5000))
    }
    console.log(`[Seed] 交易历史明细: ${tradeHistory.length} 条`)

    console.log('\n[Seed] ✅ 所有种子数据写入完成!')
    process.exit(0)
  } catch (err) {
    console.error('[Seed] ❌ 失败:', err.message)
    process.exit(1)
  }
}

seed()
