import mongoose from 'mongoose'

const productSalesSchema = new mongoose.Schema({
  product: String,
  salesVolume: Number,
  yoyGrowth: Number,
})

export default mongoose.model('ProductSales', productSalesSchema)
