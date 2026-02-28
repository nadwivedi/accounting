const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  refType: {
    type: String,
    enum: ['purchase', 'none'],
    default: 'none'
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  method: {
    type: String,
    enum: ['cash', 'bank', 'upi', 'card', 'credit', 'other'],
    default: 'cash'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
