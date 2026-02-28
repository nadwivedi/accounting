const PurchaseReturn = require('../models/PurchaseReturn');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: PurchaseReturn,
  entryName: 'Purchase return voucher',
  fields: [
    { name: 'debitAccount', label: 'Debit account', required: true },
    { name: 'creditAccount', label: 'Credit account', required: true }
  ]
});

exports.createPurchaseReturn = createEntry;
exports.getAllPurchaseReturns = getAllEntries;
