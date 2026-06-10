import mongoose from 'mongoose'

const indicatorSchema = new mongoose.Schema({
  title: String,
  value: Number,
  prefix: String,
  suffix: String,
  trend: { type: String, enum: ['up', 'down'] },
  trendValue: Number,
  color: String,
  order: Number,
})

export default mongoose.model('Indicator', indicatorSchema)
