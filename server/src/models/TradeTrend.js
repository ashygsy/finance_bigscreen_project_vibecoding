import mongoose from 'mongoose'

const tradeTrendSchema = new mongoose.Schema({
  time: String,
  transfer: Number,
  consumption: Number,
  finance: Number,
  date: { type: Date, default: Date.now },
})

export default mongoose.model('TradeTrend', tradeTrendSchema)
