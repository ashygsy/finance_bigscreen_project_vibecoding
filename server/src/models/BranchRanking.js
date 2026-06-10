import mongoose from 'mongoose'

const branchRankingSchema = new mongoose.Schema({
  branch: String,
  performance: Number,
  year: { type: Number, default: 2026 },
})

export default mongoose.model('BranchRanking', branchRankingSchema)
