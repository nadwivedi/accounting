const mongoose = require('mongoose');
const PurchaseDiscount = require('../../models/voucher/PurchaseDiscount');
const Purchase = require('../../models/voucher/Purchase');
const Payment = require('../../models/voucher/Payment');
const Party = require('../../models/master/Party');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getNextPurchaseDiscountVoucherNumber = async (userId) => {
  const entries = await PurchaseDiscount.find({ userId })
    .select('voucherNumber createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const nextSequence = entries.reduce((max, entry) => {
    const match = String(entry?.voucherNumber || '').trim().match(/^pd-(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number.parseInt(match[1], 10) || 0);
  }, 0) + 1;

  return `PD-${String(nextSequence).padStart(2, '0')}`;
};

const getLinkedPurchasePaymentTotal = async (purchaseId, userId) => {
  const result = await Payment.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        refType: 'purchase',
        refId: new mongoose.Types.ObjectId(purchaseId)
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return toNumber(result[0]?.total);
};

exports.createPurchaseDiscount = async (req, res) => {
  try {
    const { voucherDate, party, purchase, amount, notes } = req.body;
    const userId = req.userId;

    const amountNumber = toNumber(amount, NaN);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (!party || !mongoose.isValidObjectId(party)) {
      return res.status(400).json({ success: false, message: 'Valid party is required' });
    }

    if (!purchase || !mongoose.isValidObjectId(purchase)) {
      return res.status(400).json({ success: false, message: 'Valid purchase is required' });
    }

    const [existingParty, existingPurchase] = await Promise.all([
      Party.findOne({ _id: party, userId }),
      Purchase.findOne({ _id: purchase, userId })
    ]);

    if (!existingParty) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }

    if (!existingPurchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (String(existingPurchase.party || '') !== String(existingParty._id)) {
      return res.status(400).json({ success: false, message: 'Selected purchase does not belong to the selected party' });
    }

    const [linkedPaymentTotal, existingDiscounts] = await Promise.all([
      getLinkedPurchasePaymentTotal(existingPurchase._id, userId),
      PurchaseDiscount.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            purchase: new mongoose.Types.ObjectId(existingPurchase._id)
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const linkedDiscountTotal = toNumber(existingDiscounts[0]?.total);
    const outstandingAmount = Math.max(0, toNumber(existingPurchase.totalAmount) - linkedPaymentTotal - linkedDiscountTotal);

    if (amountNumber > outstandingAmount) {
      return res.status(400).json({
        success: false,
        message: `Discount cannot exceed remaining payable of Rs ${outstandingAmount.toFixed(2)}`
      });
    }

    const voucherNumber = await getNextPurchaseDiscountVoucherNumber(userId);
    const purchaseDiscount = await PurchaseDiscount.create({
      userId,
      voucherNumber,
      voucherDate: voucherDate || new Date(),
      party: existingParty._id,
      purchase: existingPurchase._id,
      amount: amountNumber,
      notes: String(notes || '').trim()
    });

    const savedEntry = await PurchaseDiscount.findById(purchaseDiscount._id)
      .populate('party', 'name type mobile')
      .populate('purchase', 'purchaseNumber purchaseDate totalAmount');

    return res.status(201).json({
      success: true,
      message: 'Purchase discount created successfully',
      data: savedEntry
    });
  } catch (error) {
    console.error('Create purchase discount error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating purchase discount'
    });
  }
};

exports.getAllPurchaseDiscounts = async (req, res) => {
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

    let entries = await PurchaseDiscount.find(filter)
      .populate('party', 'name type mobile')
      .populate('purchase', 'purchaseNumber purchaseDate totalAmount')
      .sort({ voucherDate: -1, createdAt: -1 });

    if (search) {
      const normalizedSearch = String(search || '').trim().toLowerCase();
      entries = entries.filter((entry) => (
        String(entry.voucherNumber || '').toLowerCase().includes(normalizedSearch)
        || String(entry.party?.name || '').toLowerCase().includes(normalizedSearch)
        || String(entry.purchase?.purchaseNumber || '').toLowerCase().includes(normalizedSearch)
        || String(entry.notes || '').toLowerCase().includes(normalizedSearch)
      ));
    }

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries
    });
  } catch (error) {
    console.error('Get purchase discounts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching purchase discounts'
    });
  }
};
