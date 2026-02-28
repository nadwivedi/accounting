const CreditNote = require('../models/CreditNote');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: CreditNote,
  entryName: 'Credit note',
  fields: [
    { name: 'creditAccount', label: 'Credit account', required: true }
  ]
});

exports.createCreditNote = createEntry;
exports.getAllCreditNotes = getAllEntries;
