const mongoose = require('mongoose');
const Payment = require('../../models/voucher/Payment');
const Purchase = require('../../models/voucher/Purchase');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getPurchaseLinkedPaymentTotal = async ({ purchaseId, userId }) => {
  const result = await Payment.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        refType: 'purchase',
        refId: new mongoose.Types.ObjectId(purchaseId)
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return toNumber(result[0]?.total);
};

const applyPurchasePayment = async ({ refId, userId, amount }) => {
  const purchase = await Purchase.findOne({ _id: refId, userId });
  if (!purchase) {
    return { error: 'Purchase not found' };
  }

  const totalAmount = toNumber(purchase.totalAmount);
  const paidAmount = await getPurchaseLinkedPaymentTotal({ purchaseId: purchase._id, userId });
  const balanceAmount = Math.max(0, totalAmount - paidAmount);

  if (amount > balanceAmount) {
    return { error: 'Amount exceeds purchase pending amount' };
  }

  return { purchase };
};

exports.createPayment = async (req, res) => {
  try {
    const {
      party,
      amount,
      method,
      paymentDate,
      notes,
      refType = 'none',
      refId = null
    } = req.body;
    const userId = req.userId;

    const amountNumber = toNumber(amount, NaN);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (party && !mongoose.isValidObjectId(party)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid party id'
      });
    }

    if (!['purchase', 'none'].includes(refType)) {
      return res.status(400).json({
        success: false,
        message: 'refType must be purchase or none'
      });
    }

    let resolvedParty = party || null;
    let resolvedRefId = null;
    let linkedPurchase = null;

    if (refType === 'purchase') {
      if (!refId || !mongoose.isValidObjectId(refId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid purchase id is required'
        });
      }

      const { purchase, error } = await applyPurchasePayment({
        refId,
        userId,
        amount: amountNumber
      });

      if (error) {
        return res.status(400).json({
          success: false,
          message: error
        });
      }

      linkedPurchase = purchase;
      resolvedRefId = refId;
      resolvedParty = resolvedParty || purchase.party || null;
    }

    const payment = await Payment.create({
      userId,
      party: resolvedParty,
      refType,
      refId: resolvedRefId,
      amount: amountNumber,
      method: method || 'Cash Account',
      paymentDate: paymentDate || new Date(),
      notes
    });

    const savedPayment = await Payment.findById(payment._id)
      .populate('party', 'name');

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: {
        payment: savedPayment,
        purchase: linkedPurchase
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating payment'
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { refType, refId, party, search, fromDate } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (refType && ['purchase', 'none'].includes(refType)) {
      filter.refType = refType;
    }

    if (refId && mongoose.isValidObjectId(refId)) {
      filter.refId = refId;
    }

    if (party && mongoose.isValidObjectId(party)) {
      filter.party = party;
    }

    if (search) {
      filter.notes = { $regex: search, $options: 'i' };
    }

    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!Number.isNaN(parsedFromDate.getTime())) {
        filter.paymentDate = { $gte: parsedFromDate };
      }
    }

    const payments = await Payment.find(filter)
      .populate('party', 'name')
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payments'
    });
  }
};

