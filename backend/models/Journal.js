const mongoose = require('mongoose');

const generateJournalNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `JRN-${date}-${stamp}${rand}`;
};

const journalSchema = new mongoose.Schema({
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
    ref: 'Party',
    default: null
  },
  debitAccount: {
    type: String,
    required: true,
    trim: true
  },
  creditAccount: {
    type: String,
    required: true,
    trim: true
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

journalSchema.pre('validate', function ensureVoucherNumber() {
  if (!this.voucherNumber) {
    this.voucherNumber = generateJournalNumber();
  }
});

journalSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('Journal', journalSchema);
