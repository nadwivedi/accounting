const mongoose = require('mongoose');
const Receipt = require('../models/Receipt');
const Sale = require('../models/Sale');
const Party = require('../models/Party');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const applySaleReceipt = async ({ refId, userId, amount }) => {
  const sale = await Sale.findOne({ _id: refId, userId });
  if (!sale) {
    return { error: 'Sale not found' };
  }

  const totalAmount = toNumber(sale.totalAmount);
  const paidAmount = toNumber(sale.paidAmount);
  const balanceAmount = Math.max(0, totalAmount - paidAmount);

  if (amount > balanceAmount) {
    return { error: 'Amount exceeds sale pending amount' };
  }

  const newPaidAmount = paidAmount + amount;
  const newBalanceAmount = Math.max(0, totalAmount - newPaidAmount);
  const paymentStatus = newBalanceAmount === 0 ? 'paid' : 'partial';

  sale.paidAmount = newPaidAmount;
  sale.balanceAmount = newBalanceAmount;
  sale.paymentStatus = paymentStatus;
  await sale.save();

  return { sale };
};

exports.createReceipt = async (req, res) => {
  try {
    const {
      party,
      amount,
      method,
      receiptDate,
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

    if (!['sale', 'none'].includes(refType)) {
      return res.status(400).json({
        success: false,
        message: 'refType must be sale or none'
      });
    }

    let resolvedParty = party || null;
    let resolvedRefId = null;
    let linkedSale = null;

    if (refType === 'sale') {
      if (!refId || !mongoose.isValidObjectId(refId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid sale id is required'
        });
      }

      const { sale, error } = await applySaleReceipt({
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

      linkedSale = sale;
      resolvedRefId = refId;
      resolvedParty = resolvedParty || sale.party || null;
    }

    if (resolvedParty) {
      const partyDoc = await Party.findOne({ _id: resolvedParty, userId });
      if (!partyDoc) {
        return res.status(404).json({
          success: false,
          message: 'Party not found'
        });
      }
    }

    const receipt = await Receipt.create({
      userId,
      party: resolvedParty,
      refType,
      refId: resolvedRefId,
      amount: amountNumber,
      method: method || 'cash',
      receiptDate: receiptDate || new Date(),
      notes
    });

    const populatedReceipt = await Receipt.findById(receipt._id)
      .populate('party', 'partyName phone');

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: {
        receipt: populatedReceipt,
        sale: linkedSale
      }
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating receipt'
    });
  }
};

exports.getAllReceipts = async (req, res) => {
  try {
    const { refType, refId, party, search } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (refType && ['sale', 'none'].includes(refType)) {
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

    const receipts = await Receipt.find(filter)
      .populate('party', 'partyName phone')
      .sort({ receiptDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    console.error('Get all receipts error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching receipts'
    });
  }
};
