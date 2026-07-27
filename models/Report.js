const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  userQuestion: String,
  aiAnalysis: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);