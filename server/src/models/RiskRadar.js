import mongoose from 'mongoose'

const riskRadarSchema = new mongoose.Schema({
  indicator: String,
  max: Number,
  current: Number,
  industryAvg: Number,
})

export default mongoose.model('RiskRadar', riskRadarSchema)
