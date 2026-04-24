const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Who performed the action
    performedBy: {
      type: {
        role: { type: String, enum: ['owner', 'employee'], default: 'owner' },
        employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
        employeeName: { type: String, default: null },
        employeeCode: { type: String, default: null }
      },
      default: () => ({ role: 'owner', employeeId: null, employeeName: null, employeeCode: null })
    },
    // What was done
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE'],
      required: true
    },
    // Which type of document was affected
    module: {
      type: String,
      enum: [
        'Purchase', 'Sale', 'Payment', 'Receipt', 'Expense',
        'SaleReturn', 'PurchaseReturn', 'SaleDiscount', 'PurchaseDiscount',
        'StockAdjustment', 'Party', 'Product', 'Bank', 'Unit', 'StockGroup'
      ],
      required: true
    },
    // Reference to the document affected
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    // Human-readable description of the record (e.g. "Pur-21", "INV-005")
    refLabel: {
      type: String,
      default: ''
    },
    // Snapshot before edit/delete
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Snapshot after create/edit
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    // Optional free-text note
    note: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// TTL index: auto-delete logs older than 2 years (optional safety)
// auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
