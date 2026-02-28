const mongoose = require('mongoose');

const leadgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Leadger', leadgerSchema);
