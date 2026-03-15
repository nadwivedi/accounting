const Sale = require('../../models/voucher/Sales');
const Product = require('../../models/master/Stock');
const Receipt = require('../../models/voucher/Receipt');
const mongoose = require('mongoose');
const fs = require('fs');
const { createSaleInvoicePdf, getSaleInvoiceAbsolutePath } = require('../../utils/saleInvoicePdf');
const { ensureSequentialNumbersForUser } = require('../../utils/voucherNumbers');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const generateInvoiceNumber = async (userId) => {
  const [latestSale] = await Sale.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        invoiceNumber: { $regex: '^[0-9]+$' }
      }
    },
    {
      $project: {
        numericInvoiceNumber: { $toInt: '$invoiceNumber' }
      }
    },
    { $sort: { numericInvoiceNumber: -1 } },
    { $limit: 1 }
  ]);

  const nextInvoiceNumber = Number(latestSale?.numericInvoiceNumber || 0) + 1;
  return String(nextInvoiceNumber).padStart(2, '0');
};

const isDuplicateSaleInvoiceError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'invoiceNumber') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'invoiceNumber')
  )
);

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

const deleteSaleInvoicePdf = (relativePath = '') => {
  if (!relativePath) return;

  const absolutePath = getSaleInvoiceAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) return;

  try {
    fs.unlinkSync(absolutePath);
  } catch (error) {
    console.error('Delete sale invoice PDF error:', error);
  }
};

const ensureSaleInvoicePdf = async (sale) => {
  if (!sale) {
    throw new Error('Sale is required to generate invoice PDF');
  }

  const generatedPdf = await createSaleInvoicePdf(sale);

  if (sale.invoicePdfPath && sale.invoicePdfPath !== generatedPdf.relativePath) {
    deleteSaleInvoicePdf(sale.invoicePdfPath);
  }

  sale.invoicePdfPath = generatedPdf.relativePath;
  await sale.save();

  return generatedPdf;
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

  const computedTotal = subtotal + taxAmount;
  const totalAmount = toNumber(payload.totalAmount, computedTotal);
  const paidAmount = Math.max(0, toNumber(payload.paidAmount));
  const initialReceiptAmount = Math.min(paidAmount, totalAmount);

  return {
    subtotal,
    taxAmount,
    totalAmount,
    initialReceiptAmount
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
      taxAmount,
      totalAmount,
      paidAmount,
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
      taxAmount,
      totalAmount,
      paidAmount
    });

    const resolvedInvoiceNumber = String(invoiceNumber || '').trim() || await generateInvoiceNumber(userId);

    const sale = await Sale.create({
      userId,
      invoiceNumber: resolvedInvoiceNumber,
      party: party || null,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate: saleDate || new Date(),
      dueDate: dueDate || null,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes
    });

    let populatedSale = await Sale.findById(sale._id)
      .populate('items.product', 'name unit')
      .populate('userId', 'companyName email phone address gstNumber bankDetails');

    try {
      await ensureSaleInvoicePdf(populatedSale);
    } catch (pdfError) {
      await Sale.findByIdAndDelete(sale._id);
      throw pdfError;
    }

    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -toNumber(item.quantity) } }
      );
    }

    if (totals.initialReceiptAmount > 0) {
      const nextReceiptNumber = await ensureReceiptNumbersForUser(userId);
      await Receipt.create({
        userId,
        receiptNumber: nextReceiptNumber,
        party: sale.party || null,
        refType: 'sale',
        refId: sale._id,
        amount: totals.initialReceiptAmount,
        method: 'cash',
        receiptDate: saleDate || new Date(),
        notes: notes || 'Auto receipt from sale'
      });
    }

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
      .populate('items.product', 'name unit');

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
      .populate('items.product', 'name unit')
      .populate('userId', 'companyName email phone address gstNumber bankDetails');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    await ensureSaleInvoicePdf(sale);

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
      .populate('items.product', 'name unit')
      .populate('userId', 'companyName email phone address gstNumber bankDetails');

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

    await ensureSaleInvoicePdf(sale);

    deleteSaleInvoicePdf(sale.invoicePdfPath);

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

// Open sale invoice PDF
exports.getSaleInvoicePdf = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOne({ _id: id, userId })
      .populate('items.product', 'name unit')
      .populate('userId', 'companyName email phone address gstNumber bankDetails');

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const generatedPdf = await ensureSaleInvoicePdf(sale);
    const absolutePath = generatedPdf.absolutePath || getSaleInvoiceAbsolutePath(sale.invoicePdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="sale-invoice-${sale.invoiceNumber || sale._id}.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Get sale invoice PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error opening sale invoice PDF'
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

    const linkedReceiptTotal = await getLinkedSaleReceiptTotal({
      saleId: sale._id,
      userId
    });
    const balanceAmount = Math.max(0, toNumber(sale.totalAmount) - linkedReceiptTotal);

    if (amount > balanceAmount) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds sale pending amount'
      });
    }

    const nextReceiptNumber = await ensureReceiptNumbersForUser(userId);

    await Receipt.create({
      userId,
      receiptNumber: nextReceiptNumber,
      party: sale.party || null,
      refType: 'sale',
      refId: sale._id,
      amount,
      method,
      receiptDate: new Date(),
      notes: notes || 'Receipt against sale'
    });

    const updatedSale = await Sale.findById(id)
      .populate('items.product', 'name unit');

    res.status(200).json({
      success: true,
      message: 'Receipt created successfully',
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

