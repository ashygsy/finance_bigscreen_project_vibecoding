import mongoose from 'mongoose'

const widgetSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  x: Number,
  y: Number,
  w: Number,
  h: Number,
  config: mongoose.Schema.Types.Mixed,
}, { _id: false })

const screenSchema = new mongoose.Schema({
  title: String,
  description: String,
  thumbnail: String,
  theme: { type: String, default: 'dark' },
  widgets: [widgetSchema],
}, {
  timestamps: true,
})

export default mongoose.model('Screen', screenSchema)
