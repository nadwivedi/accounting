const mongoose = require('mongoose');

const stockGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Stock group name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

stockGroupSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('StockGroup', stockGroupSchema);
