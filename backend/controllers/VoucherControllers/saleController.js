const Sale = require('../../models/voucher/Sales');
const Product = require('../../models/master/Stock');
const Receipt = require('../../models/voucher/Receipt');
const mongoose = require('mongoose');
const fs = require('fs');
const { createSaleInvoicePdf, getSaleInvoiceAbsolutePath } = require('../../utils/saleInvoicePdf');
const { ensureSequentialNumbersForUser } = require('../../utils/voucherNumbers');

const SALE_TYPES = {
  SALE: 'sale',
  CREDIT: 'credit sale',
  CASH: 'cash sale'
};

const AUTO_RECEIPT_SOURCES = ['sale-payment', 'sale-excess-payment'];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// ─── Invoice number helpers ──────────────────────────────────────────────────

const getInvoiceYear = (dateValue = new Date()) => {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return new Date().getFullYear();
  return date.getFullYear();
};

const buildYearlyInvoiceNumber = ({ year, sequence }) => `INV-${year}-${String(sequence).padStart(3, '0')}`;

const generateInvoiceNumber = async (userId, saleDate = new Date()) => {
  const invoiceYear = getInvoiceYear(saleDate);
  const invoicePattern = new RegExp(`^INV-${invoiceYear}-(\\d+)$`, 'i');

  const matchingSales = await Sale.find({
    userId,
    invoiceNumber: { $regex: `^INV-${invoiceYear}-` }
  }).select('invoiceNumber').lean();

  const nextSequence = matchingSales.reduce((max, sale) => {
    const match = String(sale.invoiceNumber || '').trim().match(invoicePattern);
    if (!match) return max;
    return Math.max(max, Number.parseInt(match[1], 10) || 0);
  }, 0) + 1;

  return buildYearlyInvoiceNumber({ year: invoiceYear, sequence: nextSequence });
};

const isDuplicateSaleInvoiceError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'invoiceNumber') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'invoiceNumber')
  )
);

// ─── Sale payment breakdown & type ──────────────────────────────────────────

const getSalePaymentBreakdown = (totalAmountValue, paidAmountValue) => {
  const totalAmount = Math.max(0, toNumber(totalAmountValue));
  const paidAmount = Math.max(0, toNumber(paidAmountValue));
  const appliedAmount = Math.min(totalAmount, paidAmount);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const excessAmount = Math.max(0, paidAmount - totalAmount);

  let type = SALE_TYPES.CREDIT;
  if (paidAmount <= 0) {
    type = SALE_TYPES.CREDIT;
  } else if (paidAmount === totalAmount) {
    type = SALE_TYPES.CASH;
  } else {
    type = SALE_TYPES.SALE;
  }

  return { totalAmount, paidAmount, appliedAmount, pendingAmount, excessAmount, type };
};

// ─── Auto-receipt sync ───────────────────────────────────────────────────────

const ensureReceiptNumbersForUser = async (userId) => ensureSequentialNumbersForUser({
  Model: Receipt,
  userId,
  fieldName: 'receiptNumber'
});

const syncSaleAutoReceipts = async (saleDoc, userId) => {
  const breakdown = getSalePaymentBreakdown(saleDoc.totalAmount, saleDoc.paidAmount);

  // Delete any previous auto-receipts for this sale
  await Receipt.deleteMany({
    originSaleId: saleDoc._id,
    receiptSource: { $in: AUTO_RECEIPT_SOURCES }
  });

  // Create receipt for the partial payment portion
  if (breakdown.appliedAmount > 0 && breakdown.appliedAmount < breakdown.totalAmount) {
    const nextReceiptNumber = await ensureReceiptNumbersForUser(userId);
    await Receipt.create({
      userId,
      party: saleDoc.party || null,
      refType: 'sale',
      refId: saleDoc._id,
      originSaleId: saleDoc._id,
      amount: breakdown.appliedAmount,
      receiptNumber: nextReceiptNumber,
      method: 'Cash Account',
      receiptDate: saleDoc.saleDate || new Date(),
      notes: `Auto receipt for ${saleDoc.invoiceNumber || 'sale payment'}`,
      receiptSource: 'sale-payment'
    });
  }

  // Create receipt for excess payment (paid more than total)
  if (breakdown.excessAmount > 0) {
    const nextReceiptNumber = await ensureReceiptNumbersForUser(userId);
    await Receipt.create({
      userId,
      party: saleDoc.party || null,
      refType: 'none',
      refId: null,
      originSaleId: saleDoc._id,
      amount: breakdown.excessAmount,
      receiptNumber: nextReceiptNumber,
      method: 'Cash Account',
      receiptDate: saleDoc.saleDate || new Date(),
      notes: `Auto excess receipt for ${saleDoc.invoiceNumber || 'sale payment'}`,
      receiptSource: 'sale-excess-payment'
    });
  }

  return breakdown;
};

// ─── PDF helpers ─────────────────────────────────────────────────────────────

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
  if (!sale) throw new Error('Sale is required to generate invoice PDF');
  const generatedPdf = await createSaleInvoicePdf(sale);
  if (sale.invoicePdfPath && sale.invoicePdfPath !== generatedPdf.relativePath) {
    deleteSaleInvoicePdf(sale.invoicePdfPath);
  }
  sale.invoicePdfPath = generatedPdf.relativePath;
  await sale.save();
  return generatedPdf;
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
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  return toNumber(result[0]?.total);
};

// ─── Controllers ────────────────────────────────────────────────────────────

exports.getNextSaleInvoiceNumber = async (req, res) => {
  try {
    const userId = req.userId;
    const { saleDate } = req.query;
    const resolvedSaleDate = saleDate ? new Date(saleDate) : new Date();
    const invoiceNumber = await generateInvoiceNumber(userId, resolvedSaleDate);
    res.status(200).json({ success: true, data: { invoiceNumber } });
  } catch (error) {
    console.error('Get next sale invoice number error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching next sale invoice number' });
  }
};

// Create sale
exports.createSale = async (req, res) => {
  try {
    const {
      party, customerName, customerPhone, customerAddress,
      items, saleDate, dueDate, subtotal, taxAmount,
      totalAmount, paidAmount, notes, invoiceNumber
    } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
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

    // Compute sale type from paidAmount
    const breakdown = getSalePaymentBreakdown(totalAmount, paidAmount);

    const resolvedSaleDate = saleDate || new Date();
    const resolvedInvoiceNumber = String(invoiceNumber || '').trim() || await generateInvoiceNumber(userId, resolvedSaleDate);

    const sale = await Sale.create({
      userId,
      invoiceNumber: resolvedInvoiceNumber,
      party: party || null,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate: resolvedSaleDate,
      dueDate: dueDate || null,
      subtotal: toNumber(subtotal),
      taxAmount: toNumber(taxAmount),
      totalAmount: breakdown.totalAmount,
      paidAmount: breakdown.paidAmount,
      type: breakdown.type,
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
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -toNumber(item.quantity) } });
    }

    // Auto-create receipts for partial/excess payments
    await syncSaleAutoReceipts(sale, userId);

    res.status(201).json({ success: true, message: 'Sale created successfully', data: populatedSale });
  } catch (error) {
    if (isDuplicateSaleInvoiceError(error)) {
      return res.status(400).json({ success: false, message: 'Invoice number already exists for this user' });
    }
    console.error('Create sale error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error creating sale' });
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
      .populate('party', 'name')
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
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    console.error('Get all sales error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching sales' });
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
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    await ensureSaleInvoicePdf(sale);
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching sale' });
  }
};

// Update sale
exports.updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { customerName, customerPhone, customerAddress, dueDate, notes, paidAmount } = req.body;

    const existingSale = await Sale.findOne({ _id: id, userId });
    if (!existingSale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const updateFields = { customerName, customerPhone, customerAddress, dueDate, notes };

    // If paidAmount updated, recompute type
    if (paidAmount !== undefined) {
      const breakdown = getSalePaymentBreakdown(existingSale.totalAmount, paidAmount);
      updateFields.paidAmount = breakdown.paidAmount;
      updateFields.type = breakdown.type;
    }

    const sale = await Sale.findOneAndUpdate(
      { _id: id, userId },
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('items.product', 'name unit')
      .populate('userId', 'companyName email phone address gstNumber bankDetails');

    // Re-sync auto-receipts if paidAmount changed
    if (paidAmount !== undefined) {
      await syncSaleAutoReceipts(sale, userId);
    }

    res.status(200).json({ success: true, message: 'Sale updated successfully', data: sale });
  } catch (error) {
    console.error('Update sale error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating sale' });
  }
};

// Delete sale
exports.deleteSale = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const sale = await Sale.findOneAndDelete({ _id: id, userId });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    deleteSaleInvoicePdf(sale.invoicePdfPath);

    for (const item of sale.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: toNumber(item.quantity) } });
    }

    // Delete all receipts linked to this sale (both auto and manual)
    await Receipt.deleteMany({ userId, refId: sale._id });
    await Receipt.deleteMany({ originSaleId: sale._id });

    res.status(200).json({ success: true, message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error deleting sale' });
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
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const generatedPdf = await ensureSaleInvoicePdf(sale);
    const absolutePath = generatedPdf.absolutePath || getSaleInvoiceAbsolutePath(sale.invoicePdfPath);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="sale-invoice-${sale.invoiceNumber || sale._id}.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    console.error('Get sale invoice PDF error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error opening sale invoice PDF' });
  }
};

// Update payment status via receipt entry (manual payment)
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, method = 'cash', notes = '' } = req.body;
    const userId = req.userId;

    const amount = toNumber(paidAmount, NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid paid amount is required' });
    }

    const sale = await Sale.findOne({ _id: id, userId });
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const linkedReceiptTotal = await getLinkedSaleReceiptTotal({ saleId: sale._id, userId });
    const balanceAmount = Math.max(0, toNumber(sale.totalAmount) - linkedReceiptTotal);

    if (amount > balanceAmount) {
      return res.status(400).json({ success: false, message: 'Amount exceeds sale pending amount' });
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
      notes: notes || 'Receipt against sale',
      receiptSource: 'manual'
    });

    const updatedSale = await Sale.findById(id).populate('items.product', 'name unit');
    res.status(200).json({ success: true, message: 'Receipt created successfully', data: updatedSale });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error updating payment status' });
  }
};
