const mongoose = require('mongoose');

const generatePurchaseInvoiceNo = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `PUR-${date}-${stamp}${rand}`;
};

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
    trim: true,
    default: generatePurchaseInvoiceNo
  },
  invoiceNumber: {
    type: String,
    trim: true,
    required: true,
    default: generatePurchaseInvoiceNo
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

purchaseSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

purchaseSchema.pre('validate', function syncInvoiceFields(next) {
  if (this.invoiceNo && !this.invoiceNumber) {
    this.invoiceNumber = this.invoiceNo;
  }

  if (this.invoiceNumber && !this.invoiceNo) {
    this.invoiceNo = this.invoiceNumber;
  }

  if (!this.invoiceNo && !this.invoiceNumber) {
    const generated = generatePurchaseInvoiceNo();
    this.invoiceNo = generated;
    this.invoiceNumber = generated;
  }

  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);
