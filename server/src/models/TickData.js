import mongoose from 'mongoose'

// 高频交易逐笔数据 — 模拟外汇/贵金属/加密货币市场 Tick 级数据
const tickDataSchema = new mongoose.Schema({
  symbol: { type: String, index: true },    // "EURUSD" | "XAUUSD" | "BTCUSD" | "USDJPY" | "GBPUSD"
  price: Number,                             // 成交价
  volume: Number,                             // 成交量
  side: { type: String, enum: ['buy', 'sell'] },
  type: { type: String, enum: ['market', 'limit'], default: 'market' },
  timestamp: { type: Date, index: true },
})

export default mongoose.model('TickData', tickDataSchema)
