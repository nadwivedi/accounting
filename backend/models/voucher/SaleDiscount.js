const mongoose = require('mongoose');

const saleDiscountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  voucherNumber: {
    type: String,
    required: true,
    trim: true
  },
  voucherDate: {
    type: Date,
    default: Date.now
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: true
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

saleDiscountSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('SaleDiscount', saleDiscountSchema);
