const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
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
    enum: ['sale', 'none'],
    default: 'none'
  },
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  originSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null
  },
  receiptSource: {
    type: String,
    enum: ['manual', 'sale-payment', 'sale-excess-payment'],
    default: 'manual'
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  receiptNumber: {
    type: Number,
    min: 1,
    default: undefined
  },
  method: {
    type: String,
    trim: true,
    default: 'Cash Account'
  },
  receiptDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Receipt', receiptSchema);
