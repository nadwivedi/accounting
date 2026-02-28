const mongoose = require('mongoose');

const generateContraNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `CON-${date}-${stamp}${rand}`;
};

const contraSchema = new mongoose.Schema({
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
  fromAccount: {
    type: String,
    required: true,
    trim: true
  },
  toAccount: {
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

contraSchema.pre('validate', function ensureVoucherNumber() {
  if (!this.voucherNumber) {
    this.voucherNumber = generateContraNumber();
  }
});

contraSchema.index({ userId: 1, voucherNumber: 1 }, { unique: true });

module.exports = mongoose.model('Contra', contraSchema);
