const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: String,
  age: Number,
  gender: String,
  bloodGroup: String,
  allergies: [String],
  chronicDiseases: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);