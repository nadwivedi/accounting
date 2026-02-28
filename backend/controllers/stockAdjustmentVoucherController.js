const StockAdjustmentVoucher = require('../models/StockAdjustmentVoucher');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: StockAdjustmentVoucher,
  entryName: 'Stock adjustment voucher',
  fields: [
    { name: 'stockItem', label: 'Stock item', required: true },
    { name: 'adjustmentType', label: 'Adjustment type', required: true },
    { name: 'quantity', label: 'Quantity', required: true }
  ]
});

exports.createStockAdjustmentVoucher = createEntry;
exports.getAllStockAdjustmentVouchers = getAllEntries;
