import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_data'
  try {
    await mongoose.connect(uri)
    console.log('[DB] MongoDB 连接成功:', uri)
  } catch (err) {
    console.error('[DB] MongoDB 连接失败:', err.message)
    process.exit(1)
  }
}
