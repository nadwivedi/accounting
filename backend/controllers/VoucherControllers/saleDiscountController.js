const mongoose = require('mongoose');
const SaleDiscount = require('../../models/voucher/SaleDiscount');
const Sale = require('../../models/voucher/Sales');
const Receipt = require('../../models/voucher/Receipt');
const Party = require('../../models/master/Party');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getNextSaleDiscountVoucherNumber = async (userId) => {
  const entries = await SaleDiscount.find({ userId })
    .select('voucherNumber createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const nextSequence = entries.reduce((max, entry) => {
    const match = String(entry?.voucherNumber || '').trim().match(/^sd-(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number.parseInt(match[1], 10) || 0);
  }, 0) + 1;

  return `SD-${String(nextSequence).padStart(2, '0')}`;
};

const getLinkedSaleReceiptTotal = async (saleId, userId) => {
  const result = await Receipt.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        refType: 'sale',
        refId: new mongoose.Types.ObjectId(saleId)
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return toNumber(result[0]?.total);
};

exports.createSaleDiscount = async (req, res) => {
  try {
    const { voucherDate, party, sale, amount, notes } = req.body;
    const userId = req.userId;

    const amountNumber = toNumber(amount, NaN);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (!party || !mongoose.isValidObjectId(party)) {
      return res.status(400).json({ success: false, message: 'Valid party is required' });
    }

    if (!sale || !mongoose.isValidObjectId(sale)) {
      return res.status(400).json({ success: false, message: 'Valid sale is required' });
    }

    const [existingParty, existingSale] = await Promise.all([
      Party.findOne({ _id: party, userId }),
      Sale.findOne({ _id: sale, userId })
    ]);

    if (!existingParty) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    if (!existingSale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    if (String(existingSale.party || '') !== String(existingParty._id)) {
      return res.status(400).json({ success: false, message: 'Selected sale does not belong to the selected party' });
    }

    const [linkedReceiptTotal, existingDiscounts] = await Promise.all([
      getLinkedSaleReceiptTotal(existingSale._id, userId),
      SaleDiscount.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            sale: new mongoose.Types.ObjectId(existingSale._id)
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const linkedDiscountTotal = toNumber(existingDiscounts[0]?.total);
    const outstandingAmount = Math.max(0, toNumber(existingSale.totalAmount) - linkedReceiptTotal - linkedDiscountTotal);

    if (amountNumber > outstandingAmount) {
      return res.status(400).json({
        success: false,
        message: `Discount cannot exceed remaining receivable of Rs ${outstandingAmount.toFixed(2)}`
      });
    }

    const voucherNumber = await getNextSaleDiscountVoucherNumber(userId);
    const saleDiscount = await SaleDiscount.create({
      userId,
      voucherNumber,
      voucherDate: voucherDate || new Date(),
      party: existingParty._id,
      sale: existingSale._id,
      amount: amountNumber,
      notes: String(notes || '').trim()
    });

    const savedEntry = await SaleDiscount.findById(saleDiscount._id)
      .populate('party', 'name type mobile')
      .populate('sale', 'invoiceNumber saleDate totalAmount');

    return res.status(201).json({
      success: true,
      message: 'Sale discount created successfully',
      data: savedEntry
    });
  } catch (error) {
    console.error('Create sale discount error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating sale discount'
    });
  }
};

exports.getAllSaleDiscounts = async (req, res) => {
  try {
    const { search, fromDate, toDate } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (fromDate || toDate) {
      filter.voucherDate = {};

      if (fromDate) {
        const parsedFromDate = new Date(fromDate);
        if (!Number.isNaN(parsedFromDate.getTime())) {
          filter.voucherDate.$gte = parsedFromDate;
        }
      }

      if (toDate) {
        const parsedToDate = new Date(toDate);
        if (!Number.isNaN(parsedToDate.getTime())) {
          parsedToDate.setHours(23, 59, 59, 999);
          filter.voucherDate.$lte = parsedToDate;
        }
      }

      if (Object.keys(filter.voucherDate).length === 0) {
        delete filter.voucherDate;
      }
    }

    let entries = await SaleDiscount.find(filter)
      .populate('party', 'name type mobile')
      .populate('sale', 'invoiceNumber saleDate totalAmount')
      .sort({ voucherDate: -1, createdAt: -1 });

    if (search) {
      const normalizedSearch = String(search || '').trim().toLowerCase();
      entries = entries.filter((entry) => (
        String(entry.voucherNumber || '').toLowerCase().includes(normalizedSearch)
        || String(entry.party?.name || '').toLowerCase().includes(normalizedSearch)
        || String(entry.sale?.invoiceNumber || '').toLowerCase().includes(normalizedSearch)
        || String(entry.notes || '').toLowerCase().includes(normalizedSearch)
      ));
    }

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Get sale discounts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sale discounts'
    });
  }
};
