const Journal = require('../models/Journal');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: Journal,
  entryName: 'Journal voucher',
  fields: [
    { name: 'debitAccount', label: 'Debit account', required: true },
    { name: 'creditAccount', label: 'Credit account', required: true }
  ]
});

exports.createJournal = createEntry;
exports.getAllJournals = getAllEntries;
