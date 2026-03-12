const mongoose = require('mongoose');

const bankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true
  },
  totalBalance: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

bankSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Bank', bankSchema);
