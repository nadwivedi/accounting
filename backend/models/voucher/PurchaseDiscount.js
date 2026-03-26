const mongoose = require('mongoose');

const purchaseDiscountSchema = new mongoose.Schema({
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
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
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

purchaseDiscountSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseDiscount', purchaseDiscountSchema);
