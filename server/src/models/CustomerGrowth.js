import mongoose from 'mongoose'

const customerGrowthSchema = new mongoose.Schema({
  month: String,
  personalCustomers: Number,
  enterpriseCustomers: Number,
})

export default mongoose.model('CustomerGrowth', customerGrowthSchema)
