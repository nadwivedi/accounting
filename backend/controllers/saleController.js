const Sale = require('../models/Sales');
const Product = require('../models/Stock');
const Receipt = require('../models/Receipt');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const generateInvoiceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `SAL-${date}-${stamp}${rand}`;
};

const isDuplicateSaleInvoiceError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'invoiceNumber') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'invoiceNumber')
  )
);

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
  const roundOff = toNumber(payload.roundOff);
  const computedTotal = subtotal + taxAmount + shippingCharges + otherCharges - discountAmount + roundOff;
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
    roundOff,
    totalAmount,
    paidAmount: normalizedPaid,
    balanceAmount,
    paymentStatus
  };
};

// Create sale
exports.createSale = async (req, res) => {
  try {
    const {
      party,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate,
      dueDate,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharges,
      otherCharges,
      roundOff,
      totalAmount,
      paidAmount,
      paymentMode,
      notes,
      invoiceNumber
    } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    for (const item of items) {
      const product = await Product.findById(item.product);
      const qty = toNumber(item.quantity);
      if (!product || product.currentStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName || 'selected product'}`
        });
      }
    }

    const totals = calculateTotals({
      items,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCharges,
      otherCharges,
      roundOff,
      totalAmount,
      paidAmount
    });

    const sale = await Sale.create({
      userId,
      invoiceNumber: invoiceNumber || generateInvoiceNumber(),
      party: party || null,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate: saleDate || new Date(),
      dueDate: dueDate || null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      taxAmount: totals.taxAmount,
      shippingCharges: totals.shippingCharges,
      otherCharges: totals.otherCharges,
      roundOff: totals.roundOff,
      totalAmount: totals.totalAmount,
      paidAmount: totals.paidAmount,
      balanceAmount: totals.balanceAmount,
      paymentStatus: totals.paymentStatus,
      paymentMode: paymentMode || 'credit',
      notes
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -toNumber(item.quantity) } }
      );
    }

    if (totals.paidAmount > 0) {
      await Receipt.create({
        userId,
        party: sale.party || null,
        refType: 'sale',
        refId: sale._id,
        amount: totals.paidAmount,
        method: paymentMode || 'cash',
        receiptDate: saleDate || new Date(),
        notes: notes || 'Auto receipt from sale'
      });
    }

    const populatedSale = await Sale.findById(sale._id)
      .populate('items.product', 'name');

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: populatedSale
    });
  } catch (error) {
    if (isDuplicateSaleInvoiceError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists for this user'
      });
    }
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating sale'
    });
  }
};

// Get all sales
exports.getAllSales = async (req, res) => {
  try {
    const { party, search, fromDate } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (party) filter.party = party;
    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!Number.isNaN(parsedFromDate.getTime())) {
        filter.saleDate = { $gte: parsedFromDate };
      }
    }

    let query = Sale.find(filter)
      .populate('items.product', 'name');

    if (search) {
      query = query.where({
        $or: [
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const sales = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sales.length,
      data: sales
    });
  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sales'
    });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOne({ _id: id, userId })
      .populate('items.product', 'name');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      data: sale
    });
  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching sale'
    });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const {
      customerName,
      customerPhone,
      customerAddress,
      dueDate,
      notes
    } = req.body;

    const sale = await Sale.findOneAndUpdate(
      { _id: id, userId },
      { customerName, customerPhone, customerAddress, dueDate, notes },
      { new: true, runValidators: true }
    )
      .populate('items.product', 'name');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sale updated successfully',
      data: sale
    });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating sale'
    });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOneAndDelete({ _id: id, userId });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: toNumber(item.quantity) } }
      );
    }

    await Receipt.deleteMany({
      userId,
      refType: 'sale',
      refId: sale._id
    });

    res.status(200).json({
      success: true,
      message: 'Sale deleted successfully'
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting sale'
    });
  }
};

// Update payment status via receipt entry
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

    const sale = await Sale.findOne({ _id: id, userId });
    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    if (amount > sale.balanceAmount) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds sale pending amount'
      });
    }

    const newPaidAmount = sale.paidAmount + amount;
    const newBalanceAmount = Math.max(0, sale.totalAmount - newPaidAmount);
    sale.paidAmount = newPaidAmount;
    sale.balanceAmount = newBalanceAmount;
    sale.paymentStatus = newBalanceAmount === 0 ? 'paid' : 'partial';
    await sale.save();

    await Receipt.create({
      userId,
      party: sale.party || null,
      refType: 'sale',
      refId: sale._id,
      amount,
      method,
      receiptDate: new Date(),
      notes: notes || 'Receipt against sale'
    });

    const updatedSale = await Sale.findById(id)
      .populate('items.product', 'name');

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: updatedSale
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status'
    });
  }
};
