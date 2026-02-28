const Contra = require('../models/Contra');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: Contra,
  entryName: 'Contra voucher',
  fields: [
    { name: 'fromAccount', label: 'From account', required: true },
    { name: 'toAccount', label: 'To account', required: true }
  ]
});

exports.createContra = createEntry;
exports.getAllContras = getAllEntries;
