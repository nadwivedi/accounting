const StockAdjustment = require('../../models/voucher/StockAdjustment');
const { createVoucherHandlers } = require('./sharedVoucherController');

const { createEntry, getAllEntries } = createVoucherHandlers({
  Model: StockAdjustment,
  entryName: 'Stock adjustment',
  includeParty: false,
  requireAmount: false,
  includeMethod: false,
  includeReferenceNo: false,
  staticPayload: {
    adjustmentType: 'subtract'
  },
  fields: [
    { name: 'stockItem', label: 'Stock item', required: true },
    { name: 'quantity', label: 'Quantity', required: true },
    { name: 'reason', label: 'Reason', required: true }
  ]
});

exports.createStockAdjustment = createEntry;
exports.getAllStockAdjustments = getAllEntries;
