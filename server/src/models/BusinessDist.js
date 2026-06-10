import mongoose from 'mongoose'

const businessDistSchema = new mongoose.Schema({
  name: String,
  value: Number,
})

export default mongoose.model('BusinessDist', businessDistSchema)
