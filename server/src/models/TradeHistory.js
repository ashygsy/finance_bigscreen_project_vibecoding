import mongoose from 'mongoose'

// 交易历史明细 — 支持多维筛选的大规模数据集
const tradeHistorySchema = new mongoose.Schema({
  txId: { type: String, unique: true },
  customerName: String,                        // 客户名称
  customerType: { type: String, enum: ['personal', 'enterprise', 'institution'] },
  amount: Number,                              // 交易金额
  type: { type: String },                      // "转账" | "消费" | "理财申购" | "贷款放款" | "还款"
  channel: { type: String },                   // "网银" | "手机银行" | "柜台" | "ATM" | "POS"
  branch: String,                              // 所属分行
  currency: { type: String, default: 'CNY' },  // "CNY" | "USD" | "EUR"
  status: { type: String, enum: ['success', 'pending', 'failed'] },
  timestamp: { type: Date, index: true },
})

// 复合索引：按类型+状态+时间 进行常见筛选查询
tradeHistorySchema.index({ type: 1, status: 1 })
tradeHistorySchema.index({ channel: 1 })
tradeHistorySchema.index({ branch: 1 })

export default mongoose.model('TradeHistory', tradeHistorySchema)
