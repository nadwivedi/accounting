const mongoose = require('mongoose');

const generateSaleReturnNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `SRT-${date}-${stamp}${rand}`;
};

const saleReturnItemSchema = new mongoose.Schema({
  saleItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  soldQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const saleReturnSchema = new mongoose.Schema({
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
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    default: null
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    default: null
  },
  items: {
    type: [saleReturnItemSchema],
    default: []
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    default: 0
  },
  method: {
    type: String,
    trim: true
  },
  referenceNo: {
    type: String,
    trim: true,
    default: ''
  },
  debitAccount: {
    type: String,
    trim: true,
    default: ''
  },
  creditAccount: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

saleReturnSchema.pre('validate', function ensureVoucherNumber() {
  if (!this.voucherNumber) {
    this.voucherNumber = generateSaleReturnNumber();
  }
});

saleReturnSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('SaleReturn', saleReturnSchema);
