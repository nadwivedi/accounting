const SaleReturn = require('../../models/voucher/SaleReturn');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: SaleReturn,
  entryName: 'Sale return voucher',
  fields: [
    { name: 'debitAccount', label: 'Debit account', required: true },
    { name: 'creditAccount', label: 'Credit account', required: true }
  ]
});

exports.createSaleReturn = createEntry;
exports.getAllSaleReturns = getAllEntries;

