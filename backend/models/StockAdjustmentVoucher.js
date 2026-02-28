const mongoose = require('mongoose');

const generateStockAdjustmentVoucherNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `SAV-${date}-${stamp}${rand}`;
};

const stockAdjustmentVoucherSchema = new mongoose.Schema({
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
    default: null
  },
  stockItem: {
    type: String,
    required: true,
    trim: true
  },
  adjustmentType: {
    type: String,
    enum: ['add', 'subtract'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.000001
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  method: {
    type: String,
    enum: ['cash', 'bank', 'upi', 'card', 'other'],
    default: 'cash'
  },
  referenceNo: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

stockAdjustmentVoucherSchema.pre('validate', function ensureVoucherNumber() {
  if (!this.voucherNumber) {
    this.voucherNumber = generateStockAdjustmentVoucherNumber();
  }
});

stockAdjustmentVoucherSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('StockAdjustmentVoucher', stockAdjustmentVoucherSchema);
