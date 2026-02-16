const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Party = require('../models/Party');
const Payment = require('../models/Payment');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const generateInvoiceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `PUR-${date}-${stamp}${rand}`;
};

const calculateTotals = (payload = {}) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const subtotal = toNumber(payload.subtotal, items.reduce((sum, item) => {
    const qty = toNumber(item.quantity);
    const price = toNumber(item.unitPrice);
    return sum + (qty * price);
  }, 0));

  const taxAmount = toNumber(payload.taxAmount, items.reduce((sum, item) => {
    return sum + toNumber(item.taxAmount);
  }, 0));

  const discountAmount = toNumber(payload.discountAmount);
  const shippingCharges = toNumber(payload.shippingCharges);
  const otherCharges = toNumber(payload.otherCharges);
  const computedTotal = subtotal + taxAmount + shippingCharges + otherCharges - discountAmount;
  const totalAmount = toNumber(payload.totalAmount, computedTotal);
  const paidAmount = Math.max(0, toNumber(payload.paidAmount));
  const normalizedPaid = Math.min(paidAmount, totalAmount);
  const balanceAmount = Math.max(0, totalAmount - normalizedPaid);
  const paymentStatus = balanceAmount === 0 ? 'paid' : (normalizedPaid > 0 ? 'partial' : 'unpaid');

  return {
    subtotal,
    taxAmount,
    discountAmount,
    shippingCharges,
    otherCharges,
    totalAmount,
    paidAmount: normalizedPaid,
    balanceAmount,
    paymentStatus
  };
};

// Create purchase
exports.createPurchase = async (req, res) => {
  try {
    const {
      party,
      items,
      purchaseDate,
      dueDate,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharges,
      otherCharges,
      totalAmount,
      paidAmount,
      paymentMode,
      invoiceLink,
      notes,
      invoiceNumber
    } = req.body;
    const userId = req.userId;

    if (!party || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Party and at least one item are required'
      });
    }

    const partyDoc = await Party.findOne({ _id: party, userId });
    if (!partyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const totals = calculateTotals({
      items,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharges,
      otherCharges,
      totalAmount,
      paidAmount
    });

    const purchase = await Purchase.create({
      userId,
      invoiceNumber: invoiceNumber || generateInvoiceNumber(),
      party,
      items,
      purchaseDate: purchaseDate || new Date(),
      dueDate: dueDate || null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      shippingCharges: totals.shippingCharges,
      otherCharges: totals.otherCharges,
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      balanceAmount: totals.balanceAmount,
      paymentStatus: totals.paymentStatus,
      paymentMode: paymentMode || 'credit',
      invoiceLink: invoiceLink || '',
      notes
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: toNumber(item.quantity) } }
      );
    }

    if (totals.paidAmount > 0) {
      await Payment.create({
        userId,
        party: purchase.party || null,
        refType: 'purchase',
        refId: purchase._id,
        amount: totals.paidAmount,
        method: paymentMode || 'cash',
        paymentDate: purchaseDate || new Date(),
        notes: notes || 'Auto payment from purchase'
      });
    }

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: populatedPurchase
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating purchase'
    });
  }
};

// Get all purchases
exports.getAllPurchases = async (req, res) => {
  try {
    const { party, search } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (party) filter.party = party;

    let query = Purchase.find(filter)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    if (search) {
      query = query.where({
        $or: [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const purchases = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    console.error('Get all purchases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching purchases'
    });
  }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const purchase = await Purchase.findOne({ _id: id, userId })
      .populate('party', 'partyName phone email')
      .populate('items.product', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      data: purchase
    });
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching purchase'
    });
  }
};

// Update purchase
exports.updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { dueDate, notes, invoiceLink } = req.body;
    const updateData = { dueDate, notes };
    if (invoiceLink !== undefined) {
      updateData.invoiceLink = invoiceLink;
    }

    const purchase = await Purchase.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: purchase
    });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating purchase'
    });
  }
};

// Delete purchase
exports.deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const purchase = await Purchase.findOneAndDelete({ _id: id, userId });
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -toNumber(item.quantity) } }
      );
    }

    await Payment.deleteMany({
      userId,
      refType: 'purchase',
      refId: purchase._id
    });

    res.status(200).json({
      success: true,
      message: 'Purchase deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting purchase'
    });
  }
};

// Update payment status via payment entry
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, method = 'cash', notes = '' } = req.body;
    const userId = req.userId;

    const amount = toNumber(paidAmount, NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid paid amount is required'
      });
    }

    const purchase = await Purchase.findOne({ _id: id, userId });
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (amount > purchase.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds purchase pending amount'
      });
    }

    const newPaidAmount = purchase.paidAmount + amount;
    const newBalanceAmount = Math.max(0, purchase.totalAmount - newPaidAmount);
    purchase.paidAmount = newPaidAmount;
    purchase.balanceAmount = newBalanceAmount;
    purchase.paymentStatus = newBalanceAmount === 0 ? 'paid' : 'partial';
    await purchase.save();

    await Payment.create({
      userId,
      party: purchase.party || null,
      refType: 'purchase',
      refId: purchase._id,
      amount,
      method,
      paymentDate: new Date(),
      notes: notes || 'Payment against purchase'
    });

    const updatedPurchase = await Purchase.findById(id)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedPurchase
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status'
    });
  }
};
