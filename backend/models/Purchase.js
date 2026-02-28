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
  balanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

purchaseSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });

purchaseSchema.pre('validate', function syncInvoiceFields() {
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

  const total = Number(this.totalAmount || 0);
  const boundedPaid = Math.min(Math.max(Number(this.paidAmount || 0), 0), total);
  const balance = Math.max(0, total - boundedPaid);

  this.paidAmount = boundedPaid;
  this.balanceAmount = balance;
  this.paymentStatus = balance === 0 ? 'paid' : (boundedPaid > 0 ? 'partial' : 'unpaid');
});

module.exports = mongoose.model('Purchase', purchaseSchema);
