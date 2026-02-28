const mongoose = require('mongoose');
const Leadger = require('../models/Leadger');
const Group = require('../models/Group');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.createLeadger = async (req, res) => {
  try {
    const {
      group,
      party,
      amount,
      method,
      voucherDate,
      referenceNo,
      notes,
      debitAccount,
      creditAccount
    } = req.body;
    const userId = req.userId;

    const amountNumber = toNumber(amount, NaN);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!group || !mongoose.isValidObjectId(group)) {
      return res.status(400).json({
        success: false,
        message: 'Valid group is required'
      });
    }

    const groupDoc = await Group.findOne({ _id: group, userId, isActive: true });
    if (!groupDoc) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (party && !mongoose.isValidObjectId(party)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid party id'
      });
    }

    if (!String(debitAccount || '').trim() || !String(creditAccount || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Debit account and credit account are required'
      });
    }

    const leadger = await Leadger.create({
      userId,
      group,
      party: party || null,
      amount: amountNumber,
      method: method || 'cash',
      voucherDate: voucherDate || new Date(),
      referenceNo: String(referenceNo || '').trim(),
      notes: String(notes || '').trim(),
      debitAccount: String(debitAccount || '').trim(),
      creditAccount: String(creditAccount || '').trim()
    });

    const populatedLeadger = await Leadger.findById(leadger._id)
      .populate('group', 'name');

    return res.status(201).json({
      success: true,
      message: 'Leadger voucher created successfully',
      data: populatedLeadger
    });
  } catch (error) {
    console.error('Create leadger error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating leadger voucher'
    });
  }
};

exports.getAllLeadgers = async (req, res) => {
  try {
    const { group, party, search, fromDate, toDate } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (group && mongoose.isValidObjectId(group)) {
      filter.group = group;
    }

    if (party && mongoose.isValidObjectId(party)) {
      filter.party = party;
    }

    if (fromDate || toDate) {
      filter.voucherDate = {};

      if (fromDate) {
        const from = new Date(fromDate);
        if (!Number.isNaN(from.getTime())) {
          filter.voucherDate.$gte = from;
        }
      }

      if (toDate) {
        const to = new Date(toDate);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filter.voucherDate.$lte = to;
        }
      }

      if (Object.keys(filter.voucherDate).length === 0) {
        delete filter.voucherDate;
      }
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { voucherNumber: searchRegex },
        { referenceNo: searchRegex },
        { notes: searchRegex },
        { debitAccount: searchRegex },
        { creditAccount: searchRegex }
      ];
    }

    const leadgers = await Leadger.find(filter)
      .populate('group', 'name')
      .sort({ voucherDate: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leadgers.length,
      data: leadgers
    });
  } catch (error) {
    console.error('Get leadgers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leadger vouchers'
    });
  }
};
