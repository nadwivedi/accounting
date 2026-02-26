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
  stockGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockGroup',
    default: null
  },
  unit: {
    type: String,
    required: true,
    enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', ],
    default: 'pcs'
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
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
