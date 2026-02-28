const mongoose = require('mongoose');

const generateStockAdjustmentNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `SAD-${date}-${stamp}${rand}`;
};

const stockAdjustmentSchema = new mongoose.Schema({
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
  stockItem: {
    type: String,
    required: true,
    trim: true
  },
  adjustmentType: {
    type: String,
    enum: ['subtract'],
    default: 'subtract'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.000001
  },
  reason: {
    type: String,
    enum: ['Loss due to expiry date', 'Theft loss', 'Other losses'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

stockAdjustmentSchema.pre('validate', function ensureVoucherNumber() {
  if (!this.voucherNumber) {
    this.voucherNumber = generateStockAdjustmentNumber();
  }
});

stockAdjustmentSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
