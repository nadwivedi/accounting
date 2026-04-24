const mongoose = require('mongoose');
const Receipt = require('../../models/voucher/Receipt');
const Sale = require('../../models/voucher/Sales');
const {
  ensureSequentialNumbersForUser,
  parsePrefixedNumberSearch
} = require('../../utils/voucherNumbers');
const { createAuditLog } = require('../../utils/auditLogger');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getLinkedSaleReceiptTotal = async ({ saleId, userId }) => {
  const result = await Receipt.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        refType: 'sale',
        refId: new mongoose.Types.ObjectId(saleId)
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

const ensureReceiptNumbersForUser = async (userId) => ensureSequentialNumbersForUser({
  Model: Receipt,
  userId,
  fieldName: 'receiptNumber'
});

const applySaleReceipt = async ({ refId, userId, amount }) => {
  const sale = await Sale.findOne({ _id: refId, userId });
  if (!sale) {
    return { error: 'Sale not found' };
  }

  // balance = totalAmount - paidAmount (can be negative for overpaid, but receipts
  // should only be applied up to the remaining positive balance)
  const balance = Math.max(0, toNumber(sale.totalAmount) - toNumber(sale.paidAmount));

  if (amount > balance) {
    return { error: `Amount exceeds sale balance. Sale balance is ₹${balance.toLocaleString('en-IN')}` };
  }

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
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    if (party && !mongoose.isValidObjectId(party)) {
      return res.status(400).json({ success: false, message: 'Invalid party id' });
    }

    if (!['sale', 'none'].includes(refType)) {
      return res.status(400).json({ success: false, message: 'refType must be sale or none' });
    }

    let resolvedParty = party || null;
    let resolvedRefId = null;
    const nextReceiptNumber = await ensureReceiptNumbersForUser(userId);

    if (refType === 'sale') {
      if (!refId || !mongoose.isValidObjectId(refId)) {
        return res.status(400).json({ success: false, message: 'Valid sale id is required' });
      }

      const { sale, error } = await applySaleReceipt({ refId, userId, amount: amountNumber });

      if (error) {
        return res.status(400).json({ success: false, message: error });
      }

      resolvedRefId = refId;
      resolvedParty = resolvedParty || sale.party || null;
    }

    const receipt = await Receipt.create({
      userId,
      receiptNumber: nextReceiptNumber,
      party: resolvedParty,
      refType,
      refId: resolvedRefId,
      amount: amountNumber,
      method: method || 'Cash Account',
      receiptDate: receiptDate || new Date(),
      notes
    });

    const savedReceipt = await Receipt.findById(receipt._id);

    await createAuditLog({
      userId,
      employee: req.employee || null,
      action: 'CREATE',
      module: 'Receipt',
      refId: receipt._id,
      refLabel: `Rec-${String(receipt.receiptNumber).padStart(2, '0')}`,
      before: null,
      after: savedReceipt
    });

    res.status(201).json({
      success: true,
      message: 'Receipt created successfully',
      data: savedReceipt
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating receipt' });
  }
};

exports.getAllReceipts = async (req, res) => {
  try {
    const { refType, refId, party, search, fromDate } = req.query;
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
      const receiptNumberSearch = parsePrefixedNumberSearch(search, 'rec');
      filter.$or = [
        ...(receiptNumberSearch ? [{ receiptNumber: receiptNumberSearch }] : []),
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!Number.isNaN(parsedFromDate.getTime())) {
        filter.receiptDate = { $gte: parsedFromDate };
      }
    }

    const receipts = await Receipt.find(filter)
      .sort({ receiptDate: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: receipts.length,
      data: receipts
    });
  } catch (error) {
    console.error('Get all receipts error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching receipts' });
  }
};

exports.updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid receipt id' });
    }

    const existingReceipt = await Receipt.findOne({ _id: id, userId });
    if (!existingReceipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    const beforeSnapshot = existingReceipt.toObject();

    const amountNumber = toNumber(amount, NaN);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (party && !mongoose.isValidObjectId(party)) {
      return res.status(400).json({ success: false, message: 'Invalid party id' });
    }
    if (!['sale', 'none'].includes(refType)) {
      return res.status(400).json({ success: false, message: 'refType must be sale or none' });
    }

    let resolvedParty = party || null;
    let resolvedRefId = null;

    if (refType === 'sale') {
      if (!refId || !mongoose.isValidObjectId(refId)) {
        return res.status(400).json({ success: false, message: 'Valid sale id is required' });
      }

      const sale = await Sale.findOne({ _id: refId, userId });
      if (!sale) {
        return res.status(400).json({ success: false, message: 'Sale not found' });
      }

      const totalAmount = toNumber(sale.totalAmount);
      const paidAmountTotal = await getLinkedSaleReceiptTotal({ saleId: sale._id, userId });
      const currentReceiptOldAmount = String(existingReceipt.refId) === String(sale._id) ? existingReceipt.amount : 0;
      const balanceAmount = Math.max(0, totalAmount - (paidAmountTotal - currentReceiptOldAmount));

      if (amountNumber > balanceAmount) {
        return res.status(400).json({ success: false, message: 'Amount exceeds sale pending amount' });
      }

      resolvedRefId = refId;
      resolvedParty = resolvedParty || sale.party || null;
    }

    existingReceipt.party = resolvedParty;
    existingReceipt.amount = amountNumber;
    existingReceipt.method = method || 'Cash Account';
    existingReceipt.receiptDate = receiptDate || new Date();
    existingReceipt.notes = notes;
    existingReceipt.refType = refType;
    existingReceipt.refId = resolvedRefId;

    await existingReceipt.save();

    const savedReceipt = await Receipt.findById(existingReceipt._id);

    await createAuditLog({
      userId,
      employee: req.employee || null,
      action: 'UPDATE',
      module: 'Receipt',
      refId: existingReceipt._id,
      refLabel: `Rec-${String(existingReceipt.receiptNumber).padStart(2, '0')}`,
      before: beforeSnapshot,
      after: savedReceipt
    });

    res.status(200).json({
      success: true,
      message: 'Receipt updated successfully',
      data: savedReceipt
    });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating receipt' });
  }
};

exports.deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid receipt id' });
    }

    const receipt = await Receipt.findOneAndDelete({ _id: id, userId });
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    await createAuditLog({
      userId,
      employee: req.employee || null,
      action: 'DELETE',
      module: 'Receipt',
      refId: receipt._id,
      refLabel: `Rec-${String(receipt.receiptNumber).padStart(2, '0')}`,
      before: receipt.toObject(),
      after: null
    });

    res.status(200).json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Delete receipt error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error deleting receipt' });
  }
};

