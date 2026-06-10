import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['admin', 'analyst', 'viewer'], default: 'viewer' },
}, {
  timestamps: true,
})

export default mongoose.model('User', userSchema)
