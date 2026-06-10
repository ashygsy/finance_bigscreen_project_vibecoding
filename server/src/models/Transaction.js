import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  txId: String,
  type: String,
  amount: Number,
  time: Date,
  status: { type: String, enum: ['success', 'pending'] },
})

export default mongoose.model('Transaction', transactionSchema)
