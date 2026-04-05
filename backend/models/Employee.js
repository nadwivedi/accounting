const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    permissions: {
      view: { type: Boolean, default: true },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
    },
    historyLimitDays: {
      type: mongoose.Schema.Types.Mixed,
      default: 7, 
    },
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ mobile: 1 }, { unique: true });
employeeSchema.index({ ownerId: 1 });

module.exports = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
