const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date,
    default: null
  },
  total: {
    type: Number,
    required: true
  }
});

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  supplierInvoice: {
    type: String,
    trim: true,
    default: undefined
  },
  purchaseNumber: {
    type: Number,
    min: 1,
    default: undefined
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    default: null
  },
  items: [purchaseItemSchema],
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    default: null
  },
  invoiceLink: {
    type: String,
    trim: true,
    default: ''
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  type: {
    type: String,
    enum: ['purchase', 'cash purchase', 'credit purchase', 'cash', 'partial', 'credit'],
    default: 'credit',
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
