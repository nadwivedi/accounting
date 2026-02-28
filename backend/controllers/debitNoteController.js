const DebitNote = require('../models/DebitNote');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: DebitNote,
  entryName: 'Debit note',
  fields: [
    { name: 'debitAccount', label: 'Debit account', required: true }
  ]
});

exports.createDebitNote = createEntry;
exports.getAllDebitNotes = getAllEntries;
