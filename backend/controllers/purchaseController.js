const Purchase = require('../models/Purchase');
const Product = require('../models/Stock');
const Party = require('../models/Party');
const Payment = require('../models/Payment');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const generateInvoiceNo = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const stamp = Date.now().toString().slice(-6);
  const rand = Math.floor(Math.random() * 90 + 10);
  return `PUR-${date}-${stamp}${rand}`;
};

const isDuplicatePurchaseInvoiceError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'invoiceNo') ||
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'invoiceNumber') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'invoiceNo') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'invoiceNumber')
  )
);

const normalizeItems = (items = []) => items.map((item) => {
  const quantity = toNumber(item.quantity);
  const unitPrice = toNumber(item.unitPrice);
  return {
    product: item.product,
    productName: String(item.productName || 'Item').trim(),
    quantity,
    unitPrice,
    total: toNumber(item.total, quantity * unitPrice)
  };
});

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'At least one item is required';
  }

  for (const item of items) {
    if (!item.product) return 'Each item must have a product';
    if (toNumber(item.quantity) <= 0) return 'Item quantity must be greater than 0';
    if (toNumber(item.unitPrice) < 0) return 'Item price cannot be negative';
  }

  return null;
};

const calculateTotalAmount = (items, requestedTotal) => {
  const computedTotal = items.reduce((sum, item) => {
    return sum + (toNumber(item.quantity) * toNumber(item.unitPrice));
  }, 0);

  return toNumber(requestedTotal, computedTotal);
};

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

// Create purchase
exports.createPurchase = async (req, res) => {
  try {
    const {
      party,
      items,
      purchaseDate,
      dueDate,
      invoiceLink,
      notes,
      invoiceNo,
      invoiceNumber,
      totalAmount,
      paymentAmount,
      paymentMethod,
      paymentDate,
      paymentNotes,
      isBillWisePayment
    } = req.body;
    const userId = req.userId;

    if (!party) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is required'
      });
    }

    const partyDoc = await Party.findOne({ _id: party, userId });
    if (!partyDoc) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const normalizedItems = normalizeItems(items || []);
    const itemError = validateItems(normalizedItems);
    if (itemError) {
      return res.status(400).json({ success: false, message: itemError });
    }

    const normalizedInvoiceNo = String(invoiceNo || invoiceNumber || '').trim();
    const resolvedInvoiceNumber = normalizedInvoiceNo || generateInvoiceNo();
    const resolvedTotalAmount = calculateTotalAmount(normalizedItems, totalAmount);
    const resolvedPaymentAmount = Math.max(0, toNumber(paymentAmount, 0));
    const resolvedBillWiseFlag = toBoolean(isBillWisePayment);

    if (resolvedPaymentAmount > resolvedTotalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount cannot exceed purchase total'
      });
    }

    const linkedBillPaidAmount = resolvedBillWiseFlag ? resolvedPaymentAmount : 0;
    const balanceAmount = Math.max(0, resolvedTotalAmount - linkedBillPaidAmount);
    const paymentStatus = balanceAmount === 0 ? 'paid' : (linkedBillPaidAmount > 0 ? 'partial' : 'unpaid');

    const basePayload = {
      userId,
      invoiceNo: resolvedInvoiceNumber,
      invoiceNumber: resolvedInvoiceNumber,
      party,
      items: normalizedItems,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      totalAmount: resolvedTotalAmount,
      paidAmount: linkedBillPaidAmount,
      balanceAmount,
      paymentStatus,
      invoiceLink: invoiceLink || '',
      notes
    };

    const purchase = await Purchase.create(basePayload);

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: toNumber(item.quantity) } }
      );
    }

    if (resolvedPaymentAmount > 0) {
      await Payment.create({
        userId,
        party,
        refType: resolvedBillWiseFlag ? 'purchase' : 'none',
        refId: resolvedBillWiseFlag ? purchase._id : null,
        amount: resolvedPaymentAmount,
        method: paymentMethod || 'cash',
        paymentDate: paymentDate ? new Date(paymentDate) : (purchaseDate ? new Date(purchaseDate) : new Date()),
        notes: paymentNotes || (resolvedBillWiseFlag
          ? `Payment against purchase ${resolvedInvoiceNumber}`
          : `On-account payment posted during purchase ${resolvedInvoiceNumber}`)
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
    if (isDuplicatePurchaseInvoiceError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists for this user'
      });
    }
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
    const { party, search, fromDate } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (party) filter.party = party;
    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!Number.isNaN(parsedFromDate.getTime())) {
        filter.purchaseDate = { $gte: parsedFromDate };
      }
    }

    let query = Purchase.find(filter)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    if (search) {
      const matchingParties = await Party.find({
        userId,
        partyName: { $regex: search, $options: 'i' }
      }, '_id');

      const partySearchClause = matchingParties.length > 0
        ? [{ party: { $in: matchingParties.map((doc) => doc._id) } }]
        : [];

      query = query.where({
        $or: [
          { invoiceNo: { $regex: search, $options: 'i' } },
          { invoiceNumber: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
          ...partySearchClause
        ]
      });
    }

    const purchases = await query.sort({ purchaseDate: -1, createdAt: -1 });

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
    const {
      party,
      items,
      purchaseDate,
      dueDate,
      totalAmount,
      notes,
      invoiceLink,
      invoiceNo,
      invoiceNumber
    } = req.body;

    const purchase = await Purchase.findOne({ _id: id, userId });
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    if (party) {
      const partyDoc = await Party.findOne({ _id: party, userId });
      if (!partyDoc) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }
      purchase.party = party;
    }

    const hasNewItems = Array.isArray(items);
    let normalizedItems = purchase.items;

    if (hasNewItems) {
      normalizedItems = normalizeItems(items);
      const itemError = validateItems(normalizedItems);
      if (itemError) {
        return res.status(400).json({ success: false, message: itemError });
      }

      for (const oldItem of purchase.items) {
        await Product.findByIdAndUpdate(
          oldItem.product,
          { $inc: { currentStock: -toNumber(oldItem.quantity) } }
        );
      }

      for (const newItem of normalizedItems) {
        await Product.findByIdAndUpdate(
          newItem.product,
          { $inc: { currentStock: toNumber(newItem.quantity) } }
        );
      }

      purchase.items = normalizedItems;
    }

    if (purchaseDate !== undefined) {
      purchase.purchaseDate = purchaseDate ? new Date(purchaseDate) : purchase.purchaseDate;
    }

    if (dueDate !== undefined) {
      purchase.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const normalizedInvoiceNo = String(invoiceNo || invoiceNumber || '').trim();
    if (normalizedInvoiceNo) {
      purchase.invoiceNo = normalizedInvoiceNo;
      purchase.invoiceNumber = normalizedInvoiceNo;
    } else {
      if (!purchase.invoiceNo && purchase.invoiceNumber) {
        purchase.invoiceNo = purchase.invoiceNumber;
      }
      if (!purchase.invoiceNumber && purchase.invoiceNo) {
        purchase.invoiceNumber = purchase.invoiceNo;
      }
      if (!purchase.invoiceNo && !purchase.invoiceNumber) {
        const generatedInvoiceNo = generateInvoiceNo();
        purchase.invoiceNo = generatedInvoiceNo;
        purchase.invoiceNumber = generatedInvoiceNo;
      }
    }

    if (invoiceLink !== undefined) {
      purchase.invoiceLink = invoiceLink || '';
    }

    if (notes !== undefined) {
      purchase.notes = notes;
    }

    if (hasNewItems || totalAmount !== undefined) {
      const recalculatedTotal = calculateTotalAmount(normalizedItems, totalAmount);
      const currentPaidAmount = toNumber(purchase.paidAmount);

      if (currentPaidAmount > recalculatedTotal) {
        return res.status(400).json({
          success: false,
          message: 'Total cannot be less than already paid bill-wise amount'
        });
      }

      purchase.totalAmount = recalculatedTotal;
      purchase.balanceAmount = Math.max(0, recalculatedTotal - currentPaidAmount);
      purchase.paymentStatus = purchase.balanceAmount === 0 ? 'paid' : (currentPaidAmount > 0 ? 'partial' : 'unpaid');
    }

    await purchase.save();

    const updatedPurchase = await Purchase.findById(id)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    res.status(200).json({
      success: true,
      message: 'Purchase updated successfully',
      data: updatedPurchase
    });
  } catch (error) {
    if (isDuplicatePurchaseInvoiceError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number already exists for this user'
      });
    }
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

// Deprecated: purchase payment status is no longer tracked in purchase entry
exports.updatePaymentStatus = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Purchase payment status tracking is removed. Use Payments separately.'
  });
};
