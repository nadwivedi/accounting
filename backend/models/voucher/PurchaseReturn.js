const mongoose = require('mongoose');

const purchaseReturnItemSchema = new mongoose.Schema({
  purchaseItemId: {
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
  purchasedQuantity: {
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

const purchaseReturnSchema = new mongoose.Schema({
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
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    default: null
  },
  items: {
    type: [purchaseReturnItemSchema],
    validate: {
      validator: (items) => Array.isArray(items) && items.length > 0,
      message: 'At least one return item is required'
    }
  },
  totalAmount: {
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

purchaseReturnSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
