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
  invoiceNo: {
    type: String,
    required: true,
    trim: true
  },
  party: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Party',
    required: [true, 'Supplier is required']
  },
  items: [purchaseItemSchema],
  purchaseDate: {
    type: Date,
    default: Date.now
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
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Purchase', purchaseSchema);
