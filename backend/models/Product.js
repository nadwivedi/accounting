const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'pack', 'dozen', 'meter', 'feet'],
    default: 'pcs'
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: 0
  },
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required'],
    min: 0
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  hsnCode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
