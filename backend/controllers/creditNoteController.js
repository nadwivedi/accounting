const CreditNote = require('../models/CreditNote');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: CreditNote,
  entryName: 'Credit note',
  requireParty: true,
  fields: [
    { name: 'creditAccount', label: 'Credit account', required: true }
  ]
});

exports.createCreditNote = createEntry;
exports.getAllCreditNotes = getAllEntries;
