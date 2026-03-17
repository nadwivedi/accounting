const mongoose = require('mongoose');
const Sale = require('../models/voucher/Sales');
const Purchase = require('../models/voucher/Purchase');
const PurchaseReturn = require('../models/voucher/PurchaseReturn');
const SaleReturn = require('../models/voucher/SaleReturn');
const Payment = require('../models/voucher/Payment');
const Receipt = require('../models/voucher/Receipt');
const Expense = require('../models/voucher/Expense');
const Product = require('../models/master/Stock');
const Party = require('../models/master/Party');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseBoundaryDate = (value, boundary = 'start') => {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const normalizedValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    if (boundary === 'end') {
      parsedDate.setHours(23, 59, 59, 999);
    } else {
      parsedDate.setHours(0, 0, 0, 0);
    }
  }

  return parsedDate;
};

const withDateFilters = (filter, dateField, fromDate, toDate) => {
  if (!fromDate && !toDate) return;
  filter[dateField] = {};
  const parsedFromDate = parseBoundaryDate(fromDate, 'start');
  const parsedToDate = parseBoundaryDate(toDate, 'end');
  if (parsedFromDate) filter[dateField].$gte = parsedFromDate;
  if (parsedToDate) filter[dateField].$lte = parsedToDate;
  if (Object.keys(filter[dateField]).length === 0) {
    delete filter[dateField];
  }
};

const getRawPartyId = (party) => {
  if (!party) return null;
  if (typeof party === 'object' && party !== null) {
    return party._id || null;
  }
  return party;
};

const getPartyLabel = (partyId, fallback = 'Account') => {
  if (!partyId) return '-';
  const suffix = String(partyId).slice(-6).toUpperCase();
  return `${fallback} ${suffix}`;
};

const getTotalQuantity = (items = []) => items.reduce(
  (sum, item) => sum + toNumber(item.quantity),
  0
);

const getItemSummary = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return '';

  const preview = items.slice(0, 3).map((item) => {
    const itemName = String(item.productName || item.product?.name || 'Item').trim() || 'Item';
    return `${itemName} x${toNumber(item.quantity)}`;
  });

  return items.length > 3
    ? `${preview.join(', ')} +${items.length - 3} more`
    : preview.join(', ');
};

const getDetailedItems = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: String(item._id || item.purchaseItemId || item.saleItemId || index),
    productName: String(item.productName || item.product?.name || 'Item').trim() || 'Item',
    quantity: toNumber(item.quantity),
    unitPrice: toNumber(item.unitPrice),
    total: toNumber(item.total),
    unit: String(item.unit || item.product?.unit || '').trim()
  }));
};

const getPartyNameMap = async (userId, partyIds = []) => {
  const uniqueIds = [...new Set(
    partyIds
      .filter(Boolean)
      .map((partyId) => String(partyId))
  )];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const parties = await Party.find({
    userId,
    _id: { $in: uniqueIds }
  }).select('name');

  return new Map(
    parties.map((party) => [String(party._id), String(party.name || '').trim() || 'Party'])
  );
};

const buildPurchasePaymentMap = (payments) => {
  const map = new Map();

  payments
    .filter((payment) => payment.refType === 'purchase' && payment.refId)
    .forEach((payment) => {
      const key = String(payment.refId);
      map.set(key, (map.get(key) || 0) + toNumber(payment.amount));
    });

  return map;
};

const buildSaleReceiptMap = (receipts) => {
  const map = new Map();

  receipts
    .filter((receipt) => receipt.refType === 'sale' && receipt.refId)
    .forEach((receipt) => {
      const key = String(receipt.refId);
      map.set(key, (map.get(key) || 0) + toNumber(receipt.amount));
    });

  return map;
};

exports.getOutstandingReport = async (req, res) => {
  try {
    const userId = req.userId;

    const [sales, purchases, payments, receipts] = await Promise.all([
      Sale.find({ userId }),
      Purchase.find({ userId }),
      Payment.find({ userId }),
      Receipt.find({ userId })
    ]);
    const saleReceiptMap = buildSaleReceiptMap(receipts);
    const purchasePaymentMap = buildPurchasePaymentMap(payments);

    const salePending = sales
      .map((sale) => {
        const partyId = getRawPartyId(sale.party);
        const paidAmount = toNumber(saleReceiptMap.get(String(sale._id)));
        const pending = Math.max(0, toNumber(sale.totalAmount) - paidAmount);
        return {
          id: sale._id,
          invoiceNumber: sale.invoiceNumber,
          date: sale.saleDate,
          partyId: partyId || null,
          partyName: sale.customerName || getPartyLabel(partyId, 'Account') || 'Walk-in',
          totalAmount: toNumber(sale.totalAmount),
          paidAmount,
          pendingAmount: pending,
          type: 'sale'
        };
      })
      .filter((row) => row.pendingAmount > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const purchasePending = purchases
      .map((purchase) => {
        const partyId = getRawPartyId(purchase.party);
        const paidAmount = toNumber(purchasePaymentMap.get(String(purchase._id)));
        const pending = Math.max(0, toNumber(purchase.totalAmount) - paidAmount);
        return {
          id: purchase._id,
          supplierInvoice: purchase.supplierInvoice || purchase.invoiceNo || purchase.invoiceNumber || '-',
          date: purchase.purchaseDate,
          partyId: partyId || null,
          partyName: getPartyLabel(partyId, 'Account'),
          totalAmount: toNumber(purchase.totalAmount),
          paidAmount,
          pendingAmount: pending,
          type: 'purchase'
        };
      })
      .filter((row) => row.pendingAmount > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const partyMap = new Map();

    const ensurePartyRow = (partyId, fallbackName = 'Account') => {
      if (!partyId) return null;
      const key = String(partyId);
      if (!partyMap.has(key)) {
        partyMap.set(key, {
          partyId,
          partyName: getPartyLabel(partyId, fallbackName),
          type: 'account',
          totalSales: 0,
          totalReceipts: 0,
          totalPurchases: 0,
          totalPayments: 0,
          receivable: 0,
          payable: 0,
          netBalance: 0
        });
      }
      return partyMap.get(key);
    };

    sales.forEach((sale) => {
      const partyId = getRawPartyId(sale.party);
      const row = ensurePartyRow(partyId, sale.customerName || 'Account');
      if (!row) return;
      if (sale.customerName) {
        row.partyName = sale.customerName;
      }
      row.totalSales += toNumber(sale.totalAmount);
    });

    receipts.forEach((receipt) => {
      const partyId = getRawPartyId(receipt.party);
      const row = ensurePartyRow(partyId);
      if (!row) return;
      row.totalReceipts += toNumber(receipt.amount);
    });

    purchases.forEach((purchase) => {
      const partyId = getRawPartyId(purchase.party);
      const row = ensurePartyRow(partyId);
      if (!row) return;
      row.totalPurchases += toNumber(purchase.totalAmount);
    });

    payments.forEach((payment) => {
      const partyId = getRawPartyId(payment.party);
      const row = ensurePartyRow(partyId);
      if (!row) return;
      row.totalPayments += toNumber(payment.amount);
    });

    const partyOutstanding = Array.from(partyMap.values())
      .map((row) => {
        row.receivable = Math.max(0, row.totalSales - row.totalReceipts);
        row.payable = Math.max(0, row.totalPurchases - row.totalPayments);
        row.netBalance = row.receivable - row.payable;
        return row;
      })
      .filter((row) => row.receivable > 0 || row.payable > 0)
      .sort((a, b) => a.partyName.localeCompare(b.partyName));

    const totals = {
      totalSalePending: salePending.reduce((sum, item) => sum + item.pendingAmount, 0),
      totalPurchasePending: purchasePending.reduce((sum, item) => sum + item.pendingAmount, 0),
      totalReceivable: partyOutstanding.reduce((sum, item) => sum + item.receivable, 0),
      totalPayable: partyOutstanding.reduce((sum, item) => sum + item.payable, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        salePending,
        purchasePending,
        partyOutstanding,
        totals
      }
    });
  } catch (error) {
    console.error('Outstanding report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching outstanding report'
    });
  }
};

exports.getPartyLedger = async (req, res) => {
  try {
    const userId = req.userId;
    const { partyId, fromDate, toDate } = req.query;

    if (partyId && !mongoose.isValidObjectId(partyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid partyId'
      });
    }

    const saleFilter = { userId };
    const purchaseFilter = { userId };
    const purchaseReturnFilter = { userId };
    const saleReturnFilter = { userId };
    const paymentFilter = { userId };
    const receiptFilter = { userId };

    if (partyId) {
      saleFilter.party = partyId;
      purchaseFilter.party = partyId;
      purchaseReturnFilter.party = partyId;
      saleReturnFilter.party = partyId;
      paymentFilter.party = partyId;
      receiptFilter.party = partyId;
    }

    withDateFilters(saleFilter, 'saleDate', fromDate, toDate);
    withDateFilters(purchaseFilter, 'purchaseDate', fromDate, toDate);
    withDateFilters(purchaseReturnFilter, 'voucherDate', fromDate, toDate);
    withDateFilters(saleReturnFilter, 'voucherDate', fromDate, toDate);
    withDateFilters(paymentFilter, 'paymentDate', fromDate, toDate);
    withDateFilters(receiptFilter, 'receiptDate', fromDate, toDate);

    const [sales, purchases, purchaseReturns, saleReturns, payments, receipts] = await Promise.all([
      Sale.find(saleFilter),
      Purchase.find(purchaseFilter),
      PurchaseReturn.find(purchaseReturnFilter),
      SaleReturn.find(saleReturnFilter),
      Payment.find(paymentFilter),
      Receipt.find(receiptFilter)
    ]);

    const partyNameMap = await getPartyNameMap(userId, [
      ...sales.map((sale) => getRawPartyId(sale.party)),
      ...purchases.map((purchase) => getRawPartyId(purchase.party)),
      ...purchaseReturns.map((purchaseReturn) => getRawPartyId(purchaseReturn.party)),
      ...saleReturns.map((saleReturn) => getRawPartyId(saleReturn.party)),
      ...payments.map((payment) => getRawPartyId(payment.party)),
      ...receipts.map((receipt) => getRawPartyId(receipt.party))
    ]);

    const resolvePartyName = (rawPartyId, fallback = 'Account') => {
      if (!rawPartyId) return fallback === 'Walk-in' ? 'Walk-in' : '-';
      return partyNameMap.get(String(rawPartyId)) || getPartyLabel(rawPartyId, fallback);
    };

    const entries = [];

    sales.forEach((sale) => {
      const salePartyId = getRawPartyId(sale.party);
      entries.push({
        date: sale.saleDate,
        entryCreatedAt: sale.createdAt || sale.saleDate,
        type: 'sale',
        refId: sale._id,
        refNumber: String(sale.invoiceNumber || '-').trim() || '-',
        partyId: salePartyId || null,
        partyName: sale.customerName || resolvePartyName(salePartyId, salePartyId ? 'Account' : 'Walk-in'),
        amount: toNumber(sale.totalAmount),
        impact: toNumber(sale.totalAmount),
        quantity: getTotalQuantity(sale.items),
        itemSummary: getItemSummary(sale.items),
        method: '',
        note: sale.notes || ''
      });
    });

    receipts.forEach((receipt) => {
      const receiptPartyId = getRawPartyId(receipt.party);
      entries.push({
        date: receipt.receiptDate,
        entryCreatedAt: receipt.createdAt || receipt.receiptDate,
        type: 'receipt',
        refId: receipt._id,
        refNumber: formatPrefixedNumber('Rec', receipt.receiptNumber),
        partyId: receiptPartyId || null,
        partyName: resolvePartyName(receiptPartyId),
        amount: toNumber(receipt.amount),
        impact: -toNumber(receipt.amount),
        quantity: 0,
        itemSummary: '',
        method: receipt.method || '',
        note: receipt.notes || ''
      });
    });

    purchases.forEach((purchase) => {
      const purchasePartyId = getRawPartyId(purchase.party);
      entries.push({
        date: purchase.purchaseDate,
        entryCreatedAt: purchase.createdAt || purchase.purchaseDate,
        type: 'purchase',
        refId: purchase._id,
        refNumber: formatPrefixedNumber('Pur', purchase.purchaseNumber),
        partyId: purchasePartyId || null,
        partyName: resolvePartyName(purchasePartyId),
        amount: toNumber(purchase.totalAmount),
        impact: -toNumber(purchase.totalAmount),
        quantity: getTotalQuantity(purchase.items),
        itemSummary: getItemSummary(purchase.items),
        method: '',
        note: purchase.notes || ''
      });
    });

    purchaseReturns.forEach((purchaseReturn) => {
      const purchaseReturnPartyId = getRawPartyId(purchaseReturn.party);
      entries.push({
        date: purchaseReturn.voucherDate,
        entryCreatedAt: purchaseReturn.createdAt || purchaseReturn.voucherDate,
        type: 'purchase return',
        refId: purchaseReturn._id,
        refNumber: purchaseReturn.voucherNumber,
        partyId: purchaseReturnPartyId || null,
        partyName: resolvePartyName(purchaseReturnPartyId),
        amount: toNumber(purchaseReturn.totalAmount),
        impact: toNumber(purchaseReturn.totalAmount),
        quantity: getTotalQuantity(purchaseReturn.items),
        itemSummary: getItemSummary(purchaseReturn.items),
        method: '',
        note: purchaseReturn.notes || ''
      });
    });

    saleReturns.forEach((saleReturn) => {
      const saleReturnPartyId = getRawPartyId(saleReturn.party);
      entries.push({
        date: saleReturn.voucherDate,
        entryCreatedAt: saleReturn.createdAt || saleReturn.voucherDate,
        type: 'sale return',
        refId: saleReturn._id,
        refNumber: saleReturn.voucherNumber,
        partyId: saleReturnPartyId || null,
        partyName: resolvePartyName(saleReturnPartyId),
        amount: toNumber(saleReturn.totalAmount || saleReturn.amount),
        impact: -toNumber(saleReturn.totalAmount || saleReturn.amount),
        quantity: getTotalQuantity(saleReturn.items),
        itemSummary: getItemSummary(saleReturn.items),
        method: '',
        note: saleReturn.notes || ''
      });
    });

    payments.forEach((payment) => {
      const paymentPartyId = getRawPartyId(payment.party);
      entries.push({
        date: payment.paymentDate,
        entryCreatedAt: payment.createdAt || payment.paymentDate,
        type: 'payment',
        refId: payment._id,
        refNumber: formatPrefixedNumber('Pay', payment.paymentNumber),
        partyId: paymentPartyId || null,
        partyName: resolvePartyName(paymentPartyId),
        amount: toNumber(payment.amount),
        impact: toNumber(payment.amount),
        quantity: 0,
        itemSummary: '',
        method: payment.method || '',
        note: payment.notes || ''
      });
    });

    entries.sort((a, b) => {
      const aDate = new Date(a.date).getTime() || 0;
      const bDate = new Date(b.date).getTime() || 0;
      if (aDate !== bDate) return aDate - bDate;

      const aCreated = new Date(a.entryCreatedAt).getTime() || 0;
      const bCreated = new Date(b.entryCreatedAt).getTime() || 0;
      return aCreated - bCreated;
    });

    let runningBalance = 0;
    const ledger = entries.map((entry) => {
      runningBalance += entry.impact;
      return {
        ...entry,
        runningBalance
      };
    });

    res.status(200).json({
      success: true,
      count: ledger.length,
      data: ledger
    });
  } catch (error) {
    console.error('Party ledger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching party ledger'
    });
  }
};

exports.getPartyLedgerEntryDetail = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, refId } = req.query;
    const normalizedType = String(type || '').trim();

    if (!normalizedType) {
      return res.status(400).json({
        success: false,
        message: 'Type is required'
      });
    }

    if (!refId || !mongoose.isValidObjectId(refId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid refId is required'
      });
    }

    let detail = null;

    if (normalizedType === 'sale') {
      const sale = await Sale.findOne({ _id: refId, userId })
        .populate('party', 'name type mobile')
        .populate('items.product', 'name unit');

      if (!sale) {
        return res.status(404).json({ success: false, message: 'Sale not found' });
      }

      detail = {
        type: 'sale',
        label: 'Sale',
        title: 'Sale Details',
        refNumber: String(sale.invoiceNumber || '-').trim() || '-',
        date: sale.saleDate,
        partyName: String(sale.customerName || sale.party?.name || 'Walk-in').trim() || 'Walk-in',
        accountName: 'Sales',
        amount: toNumber(sale.totalAmount),
        quantity: getTotalQuantity(sale.items),
        method: '',
        notes: String(sale.notes || '').trim(),
        linkedReference: '',
        fields: [
          { label: 'Party', value: String(sale.customerName || sale.party?.name || 'Walk-in').trim() || 'Walk-in' },
          { label: 'Invoice Date', value: sale.saleDate },
          { label: 'Invoice No', value: String(sale.invoiceNumber || '-').trim() || '-' },
          { label: 'Paid Amount', value: toNumber(sale.paidAmount) },
          { label: 'Due Amount', value: toNumber(sale.dueAmount) }
        ],
        items: getDetailedItems(sale.items)
      };
    } else if (normalizedType === 'purchase') {
      const purchase = await Purchase.findOne({ _id: refId, userId })
        .populate('party', 'name type mobile')
        .populate('items.product', 'name unit');

      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Purchase not found' });
      }

      detail = {
        type: 'purchase',
        label: 'Purchase',
        title: 'Purchase Details',
        refNumber: formatPrefixedNumber('Pur', purchase.purchaseNumber),
        date: purchase.purchaseDate,
        partyName: String(purchase.party?.name || '-').trim() || '-',
        accountName: 'Purchase',
        amount: toNumber(purchase.totalAmount),
        quantity: getTotalQuantity(purchase.items),
        method: '',
        notes: String(purchase.notes || '').trim(),
        linkedReference: String(purchase.supplierInvoice || '').trim(),
        fields: [
          { label: 'Party', value: String(purchase.party?.name || '-').trim() || '-' },
          { label: 'Purchase Date', value: purchase.purchaseDate },
          { label: 'Voucher No', value: formatPrefixedNumber('Pur', purchase.purchaseNumber) },
          { label: 'Supplier Bill', value: String(purchase.supplierInvoice || '-').trim() || '-' },
          { label: 'Due Date', value: purchase.dueDate || '' }
        ],
        items: getDetailedItems(purchase.items)
      };
    } else if (normalizedType === 'receipt') {
      const receipt = await Receipt.findOne({ _id: refId, userId })
        .populate('party', 'name type mobile')
        .populate('refId');

      if (!receipt) {
        return res.status(404).json({ success: false, message: 'Receipt not found' });
      }

      detail = {
        type: 'receipt',
        label: 'Receipt',
        title: 'Receipt Details',
        refNumber: formatPrefixedNumber('Rec', receipt.receiptNumber),
        date: receipt.receiptDate,
        partyName: String(receipt.party?.name || '-').trim() || '-',
        accountName: receipt.refType === 'sale' ? 'Against Sale' : 'On Account',
        amount: toNumber(receipt.amount),
        quantity: 0,
        method: String(receipt.method || '').trim(),
        notes: String(receipt.notes || '').trim(),
        linkedReference: receipt.refType === 'sale'
          ? String(receipt.refId?.invoiceNumber || '-').trim() || '-'
          : '',
        fields: [
          { label: 'Party', value: String(receipt.party?.name || '-').trim() || '-' },
          { label: 'Receipt Date', value: receipt.receiptDate },
          { label: 'Receipt No', value: formatPrefixedNumber('Rec', receipt.receiptNumber) },
          { label: 'Method', value: String(receipt.method || '-').trim() || '-' },
          { label: 'Reference Type', value: receipt.refType === 'sale' ? 'Against Sale' : 'On Account' }
        ],
        items: []
      };
    } else if (normalizedType === 'payment') {
      const payment = await Payment.findOne({ _id: refId, userId })
        .populate('party', 'name type mobile')
        .populate('refId');

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      detail = {
        type: 'payment',
        label: 'Payment',
        title: 'Payment Details',
        refNumber: formatPrefixedNumber('Pay', payment.paymentNumber),
        date: payment.paymentDate,
        partyName: String(payment.party?.name || '-').trim() || '-',
        accountName: payment.refType === 'purchase' ? 'Against Purchase' : 'On Account',
        amount: toNumber(payment.amount),
        quantity: 0,
        method: String(payment.method || '').trim(),
        notes: String(payment.notes || '').trim(),
        linkedReference: payment.refType === 'purchase'
          ? formatPrefixedNumber('Pur', payment.refId?.purchaseNumber)
          : '',
        fields: [
          { label: 'Party', value: String(payment.party?.name || '-').trim() || '-' },
          { label: 'Payment Date', value: payment.paymentDate },
          { label: 'Payment No', value: formatPrefixedNumber('Pay', payment.paymentNumber) },
          { label: 'Method', value: String(payment.method || '-').trim() || '-' },
          { label: 'Reference Type', value: payment.refType === 'purchase' ? 'Against Purchase' : 'On Account' }
        ],
        items: []
      };
    } else if (normalizedType === 'expense') {
      const expense = await Expense.findOne({ _id: refId, userId })
        .populate('expenseGroup', 'name')
        .populate('party', 'name type mobile');

      if (!expense) {
        return res.status(404).json({ success: false, message: 'Expense not found' });
      }

      detail = {
        type: 'expense',
        label: 'Expense',
        title: 'Expense Details',
        refNumber: '-',
        date: expense.expenseDate,
        partyName: String(expense.party?.name || '-').trim() || '-',
        accountName: String(expense.expenseGroup?.name || 'Expense').trim() || 'Expense',
        amount: toNumber(expense.amount),
        quantity: 0,
        method: String(expense.method || '').trim(),
        notes: String(expense.notes || '').trim(),
        linkedReference: '',
        fields: [
          { label: 'Expense Group', value: String(expense.expenseGroup?.name || 'Expense').trim() || 'Expense' },
          { label: 'Expense Date', value: expense.expenseDate },
          { label: 'Party', value: String(expense.party?.name || '-').trim() || '-' },
          { label: 'Method', value: String(expense.method || '-').trim() || '-' }
        ],
        items: []
      };
    } else if (normalizedType === 'purchase return' || normalizedType === 'purchaseReturn') {
      const purchaseReturn = await PurchaseReturn.findOne({ _id: refId, userId })
        .populate('purchase', 'purchaseNumber supplierInvoice purchaseDate')
        .populate('party', 'name type mobile')
        .populate('items.product', 'name unit');

      if (!purchaseReturn) {
        return res.status(404).json({ success: false, message: 'Purchase return not found' });
      }

      detail = {
        type: 'purchase return',
        label: 'Purchase Return',
        title: 'Purchase Return Details',
        refNumber: String(purchaseReturn.voucherNumber || '-').trim() || '-',
        date: purchaseReturn.voucherDate,
        partyName: String(purchaseReturn.party?.name || '-').trim() || '-',
        accountName: 'Purchase Return',
        amount: toNumber(purchaseReturn.totalAmount),
        quantity: getTotalQuantity(purchaseReturn.items),
        method: '',
        notes: String(purchaseReturn.notes || '').trim(),
        linkedReference: formatPrefixedNumber('Pur', purchaseReturn.purchase?.purchaseNumber),
        fields: [
          { label: 'Party', value: String(purchaseReturn.party?.name || '-').trim() || '-' },
          { label: 'Voucher Date', value: purchaseReturn.voucherDate },
          { label: 'Voucher No', value: String(purchaseReturn.voucherNumber || '-').trim() || '-' },
          { label: 'Against Purchase', value: formatPrefixedNumber('Pur', purchaseReturn.purchase?.purchaseNumber) },
          { label: 'Supplier Bill', value: String(purchaseReturn.purchase?.supplierInvoice || '-').trim() || '-' }
        ],
        items: getDetailedItems(purchaseReturn.items)
      };
    } else if (normalizedType === 'sale return' || normalizedType === 'saleReturn') {
      const saleReturn = await SaleReturn.findOne({ _id: refId, userId })
        .populate('sale', 'invoiceNumber customerName saleDate')
        .populate('party', 'name type mobile')
        .populate('items.product', 'name unit');

      if (!saleReturn) {
        return res.status(404).json({ success: false, message: 'Sale return not found' });
      }

      detail = {
        type: 'sale return',
        label: 'Sale Return',
        title: 'Sale Return Details',
        refNumber: String(saleReturn.voucherNumber || '-').trim() || '-',
        date: saleReturn.voucherDate,
        partyName: String(saleReturn.party?.name || saleReturn.sale?.customerName || '-').trim() || '-',
        accountName: 'Sale Return',
        amount: toNumber(saleReturn.totalAmount || saleReturn.amount),
        quantity: getTotalQuantity(saleReturn.items),
        method: '',
        notes: String(saleReturn.notes || '').trim(),
        linkedReference: String(saleReturn.sale?.invoiceNumber || '-').trim() || '-',
        fields: [
          { label: 'Party', value: String(saleReturn.party?.name || saleReturn.sale?.customerName || '-').trim() || '-' },
          { label: 'Voucher Date', value: saleReturn.voucherDate },
          { label: 'Voucher No', value: String(saleReturn.voucherNumber || '-').trim() || '-' },
          { label: 'Against Sale', value: String(saleReturn.sale?.invoiceNumber || '-').trim() || '-' },
          { label: 'Sale Date', value: saleReturn.sale?.saleDate || '' }
        ],
        items: getDetailedItems(saleReturn.items)
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported voucher type'
      });
    }

    return res.status(200).json({
      success: true,
      data: detail
    });
  } catch (error) {
    console.error('Party ledger entry detail error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching voucher details'
    });
  }
};

const formatPrefixedNumber = (prefix, value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return '-';
  return `${prefix}-${String(parsed).padStart(2, '0')}`;
};

exports.getDayBookReport = async (req, res) => {
  try {
    const userId = req.userId;
    const { fromDate, toDate } = req.query;

    const saleFilter = { userId };
    const purchaseFilter = { userId };
    const purchaseReturnFilter = { userId };
    const saleReturnFilter = { userId };
    const paymentFilter = { userId };
    const receiptFilter = { userId };
    const expenseFilter = { userId };

    withDateFilters(saleFilter, 'saleDate', fromDate, toDate);
    withDateFilters(purchaseFilter, 'purchaseDate', fromDate, toDate);
    withDateFilters(purchaseReturnFilter, 'voucherDate', fromDate, toDate);
    withDateFilters(saleReturnFilter, 'voucherDate', fromDate, toDate);
    withDateFilters(paymentFilter, 'paymentDate', fromDate, toDate);
    withDateFilters(receiptFilter, 'receiptDate', fromDate, toDate);
    withDateFilters(expenseFilter, 'expenseDate', fromDate, toDate);

    const [sales, purchases, purchaseReturns, saleReturns, payments, receipts, expenses] = await Promise.all([
      Sale.find(saleFilter),
      Purchase.find(purchaseFilter),
      PurchaseReturn.find(purchaseReturnFilter),
      SaleReturn.find(saleReturnFilter),
      Payment.find(paymentFilter),
      Receipt.find(receiptFilter),
      Expense.find(expenseFilter)
        .populate('expenseGroup', 'name')
        .populate('party', 'name')
    ]);

    const partyNameMap = await getPartyNameMap(userId, [
      ...sales.map((sale) => getRawPartyId(sale.party)),
      ...purchases.map((purchase) => getRawPartyId(purchase.party)),
      ...purchaseReturns.map((purchaseReturn) => getRawPartyId(purchaseReturn.party)),
      ...saleReturns.map((saleReturn) => getRawPartyId(saleReturn.party)),
      ...payments.map((payment) => getRawPartyId(payment.party)),
      ...receipts.map((receipt) => getRawPartyId(receipt.party)),
      ...expenses.map((expense) => getRawPartyId(expense.party))
    ]);

    const resolvePartyName = (rawPartyId, fallback = '-') => {
      if (!rawPartyId) return fallback;
      return partyNameMap.get(String(rawPartyId)) || getPartyLabel(rawPartyId, 'Account');
    };

    const entries = [];

    sales.forEach((sale) => {
      const salePartyId = getRawPartyId(sale.party);
      const amount = toNumber(sale.totalAmount);
      entries.push({
        date: sale.saleDate,
        entryCreatedAt: sale.createdAt || sale.saleDate,
        type: 'sale',
        label: 'Sale',
        refId: sale._id,
        voucherNumber: String(sale.invoiceNumber || '-').trim() || '-',
        partyId: salePartyId || null,
        partyName: sale.customerName || resolvePartyName(salePartyId, 'Walk-in'),
        accountName: 'Sales',
        particulars: getItemSummary(sale.items),
        quantity: getTotalQuantity(sale.items),
        method: '',
        note: sale.notes || '',
        amount,
        inAmount: 0,
        outAmount: 0
      });
    });

    purchases.forEach((purchase) => {
      const purchasePartyId = getRawPartyId(purchase.party);
      const amount = toNumber(purchase.totalAmount);
      const supplierInvoice = String(purchase.supplierInvoice || '').trim();
      entries.push({
        date: purchase.purchaseDate,
        entryCreatedAt: purchase.createdAt || purchase.purchaseDate,
        type: 'purchase',
        label: 'Purchase',
        refId: purchase._id,
        voucherNumber: formatPrefixedNumber('Pur', purchase.purchaseNumber),
        partyId: purchasePartyId || null,
        partyName: resolvePartyName(purchasePartyId),
        accountName: 'Purchase',
        particulars: supplierInvoice
          ? `${getItemSummary(purchase.items)} | Supplier Bill: ${supplierInvoice}`
          : getItemSummary(purchase.items),
        quantity: getTotalQuantity(purchase.items),
        method: '',
        note: purchase.notes || '',
        amount,
        inAmount: 0,
        outAmount: 0
      });
    });

    receipts.forEach((receipt) => {
      const receiptPartyId = getRawPartyId(receipt.party);
      const amount = toNumber(receipt.amount);
      entries.push({
        date: receipt.receiptDate,
        entryCreatedAt: receipt.createdAt || receipt.receiptDate,
        type: 'receipt',
        label: 'Receipt',
        refId: receipt._id,
        voucherNumber: formatPrefixedNumber('Rec', receipt.receiptNumber),
        partyId: receiptPartyId || null,
        partyName: resolvePartyName(receiptPartyId),
        accountName: receipt.refType === 'sale' ? 'Against Sale' : 'On Account',
        particulars: receipt.notes || (receipt.refType === 'sale' ? 'Receipt against sale invoice' : 'On-account receipt'),
        quantity: 0,
        method: receipt.method || '',
        note: receipt.notes || '',
        amount,
        inAmount: amount,
        outAmount: 0
      });
    });

    payments.forEach((payment) => {
      const paymentPartyId = getRawPartyId(payment.party);
      const amount = toNumber(payment.amount);
      entries.push({
        date: payment.paymentDate,
        entryCreatedAt: payment.createdAt || payment.paymentDate,
        type: 'payment',
        label: 'Payment',
        refId: payment._id,
        voucherNumber: formatPrefixedNumber('Pay', payment.paymentNumber),
        partyId: paymentPartyId || null,
        partyName: resolvePartyName(paymentPartyId),
        accountName: payment.refType === 'purchase' ? 'Against Purchase' : 'On Account',
        particulars: payment.notes || (payment.refType === 'purchase' ? 'Payment against purchase bill' : 'On-account payment'),
        quantity: 0,
        method: payment.method || '',
        note: payment.notes || '',
        amount,
        inAmount: 0,
        outAmount: amount
      });
    });

    expenses.forEach((expense) => {
      const expensePartyId = getRawPartyId(expense.party);
      const amount = toNumber(expense.amount);
      entries.push({
        date: expense.expenseDate,
        entryCreatedAt: expense.createdAt || expense.expenseDate,
        type: 'expense',
        label: 'Expense',
        refId: expense._id,
        voucherNumber: '-',
        partyId: expensePartyId || null,
        partyName: resolvePartyName(expensePartyId),
        accountName: String(expense.expenseGroup?.name || 'Expense').trim() || 'Expense',
        particulars: expense.notes || String(expense.expenseGroup?.name || 'Expense').trim() || 'Expense entry',
        quantity: 0,
        method: expense.method || '',
        note: expense.notes || '',
        amount,
        inAmount: 0,
        outAmount: amount
      });
    });

    purchaseReturns.forEach((purchaseReturn) => {
      const purchaseReturnPartyId = getRawPartyId(purchaseReturn.party);
      const amount = toNumber(purchaseReturn.totalAmount);
      entries.push({
        date: purchaseReturn.voucherDate,
        entryCreatedAt: purchaseReturn.createdAt || purchaseReturn.voucherDate,
        type: 'purchaseReturn',
        label: 'Purchase Return',
        refId: purchaseReturn._id,
        voucherNumber: String(purchaseReturn.voucherNumber || '-').trim() || '-',
        partyId: purchaseReturnPartyId || null,
        partyName: resolvePartyName(purchaseReturnPartyId),
        accountName: 'Purchase Return',
        particulars: getItemSummary(purchaseReturn.items),
        quantity: getTotalQuantity(purchaseReturn.items),
        method: '',
        note: purchaseReturn.notes || '',
        amount,
        inAmount: amount,
        outAmount: 0
      });
    });

    saleReturns.forEach((saleReturn) => {
      const saleReturnPartyId = getRawPartyId(saleReturn.party);
      const amount = toNumber(saleReturn.totalAmount || saleReturn.amount);
      entries.push({
        date: saleReturn.voucherDate,
        entryCreatedAt: saleReturn.createdAt || saleReturn.voucherDate,
        type: 'saleReturn',
        label: 'Sale Return',
        refId: saleReturn._id,
        voucherNumber: String(saleReturn.voucherNumber || '-').trim() || '-',
        partyId: saleReturnPartyId || null,
        partyName: resolvePartyName(saleReturnPartyId),
        accountName: 'Sale Return',
        particulars: getItemSummary(saleReturn.items) || saleReturn.notes || 'Sale return voucher',
        quantity: getTotalQuantity(saleReturn.items),
        method: '',
        note: saleReturn.notes || '',
        amount,
        inAmount: 0,
        outAmount: amount
      });
    });

    entries.sort((a, b) => {
      const aDate = new Date(a.date).getTime() || 0;
      const bDate = new Date(b.date).getTime() || 0;
      if (aDate !== bDate) return aDate - bDate;

      const aCreated = new Date(a.entryCreatedAt).getTime() || 0;
      const bCreated = new Date(b.entryCreatedAt).getTime() || 0;
      return aCreated - bCreated;
    });

    const summary = entries.reduce((acc, entry) => {
      acc.entryCount += 1;
      acc.totalInward += toNumber(entry.inAmount);
      acc.totalOutward += toNumber(entry.outAmount);

      if (entry.type === 'sale') acc.sales += entry.amount;
      if (entry.type === 'purchase') acc.purchases += entry.amount;
      if (entry.type === 'receipt') acc.receipts += entry.amount;
      if (entry.type === 'payment') acc.payments += entry.amount;
      if (entry.type === 'expense') acc.expenses += entry.amount;
      if (entry.type === 'purchaseReturn') acc.purchaseReturns += entry.amount;
      if (entry.type === 'saleReturn') acc.saleReturns += entry.amount;

      return acc;
    }, {
      entryCount: 0,
      totalInward: 0,
      totalOutward: 0,
      sales: 0,
      purchases: 0,
      receipts: 0,
      payments: 0,
      expenses: 0,
      purchaseReturns: 0,
      saleReturns: 0
    });

    res.status(200).json({
      success: true,
      count: entries.length,
      data: {
        summary,
        entries
      }
    });
  } catch (error) {
    console.error('Day book report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching day book report'
    });
  }
};

exports.getStockLedger = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, fromDate, toDate } = req.query;

    if (productId && !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid productId'
      });
    }

    const purchaseFilter = { userId };
    const saleFilter = { userId };
    const purchaseReturnFilter = { userId };
    const saleReturnFilter = { userId };
    withDateFilters(purchaseFilter, 'purchaseDate', fromDate, toDate);
    withDateFilters(saleFilter, 'saleDate', fromDate, toDate);
    withDateFilters(purchaseReturnFilter, 'voucherDate', fromDate, toDate);
    withDateFilters(saleReturnFilter, 'voucherDate', fromDate, toDate);

    const [purchases, sales, purchaseReturns, saleReturns, products] = await Promise.all([
      Purchase.find(purchaseFilter).populate('items.product', 'name'),
      Sale.find(saleFilter).populate('items.product', 'name'),
      PurchaseReturn.find(purchaseReturnFilter).populate('items.product', 'name'),
      SaleReturn.find(saleReturnFilter).populate('items.product', 'name'),
      Product.find({ userId }, 'name currentStock')
    ]);

    const partyNameMap = await getPartyNameMap(userId, [
      ...purchases.map((purchase) => getRawPartyId(purchase.party)),
      ...sales.map((sale) => getRawPartyId(sale.party)),
      ...purchaseReturns.map((purchaseReturn) => getRawPartyId(purchaseReturn.party)),
      ...saleReturns.map((saleReturn) => getRawPartyId(saleReturn.party))
    ]);

    const resolvePartyName = (rawPartyId, fallback = '-') => {
      if (!rawPartyId) return fallback;
      return partyNameMap.get(String(rawPartyId)) || getPartyLabel(rawPartyId, 'Account');
    };

    const rows = [];

    purchases.forEach((purchase) => {
      const purchasePartyId = getRawPartyId(purchase.party);
      purchase.items.forEach((item) => {
        if (!item.product) return;
        const productKey = String(item.product._id);
        if (productId && productKey !== String(productId)) return;
        rows.push({
          date: purchase.purchaseDate,
          entryCreatedAt: purchase.createdAt || purchase.purchaseDate,
          type: 'purchase',
          refId: purchase._id,
          refNumber: formatPrefixedNumber('Pur', purchase.purchaseNumber),
          partyName: resolvePartyName(purchasePartyId),
          productId: item.product._id,
          productName: item.product.name,
          inQty: toNumber(item.quantity),
          outQty: 0,
          note: purchase.notes || ''
        });
      });
    });

    sales.forEach((sale) => {
      const salePartyId = getRawPartyId(sale.party);
      sale.items.forEach((item) => {
        if (!item.product) return;
        const productKey = String(item.product._id);
        if (productId && productKey !== String(productId)) return;
        rows.push({
          date: sale.saleDate,
          entryCreatedAt: sale.createdAt || sale.saleDate,
          type: 'sale',
          refId: sale._id,
          refNumber: String(sale.invoiceNumber || '-').trim() || '-',
          partyName: sale.customerName || resolvePartyName(salePartyId, 'Walk-in'),
          productId: item.product._id,
          productName: item.product.name,
          inQty: 0,
          outQty: toNumber(item.quantity),
          note: sale.notes || ''
        });
      });
    });

    purchaseReturns.forEach((purchaseReturn) => {
      const purchaseReturnPartyId = getRawPartyId(purchaseReturn.party);
      purchaseReturn.items.forEach((item) => {
        if (!item.product) return;
        const productKey = String(item.product._id || item.product);
        if (productId && productKey !== String(productId)) return;
        rows.push({
          date: purchaseReturn.voucherDate,
          entryCreatedAt: purchaseReturn.createdAt || purchaseReturn.voucherDate,
          type: 'purchase return',
          refId: purchaseReturn._id,
          refNumber: purchaseReturn.voucherNumber || '-',
          partyName: resolvePartyName(purchaseReturnPartyId),
          productId: item.product._id || item.product,
          productName: item.productName || item.product?.name || 'Item',
          inQty: 0,
          outQty: toNumber(item.quantity),
          note: purchaseReturn.notes || ''
        });
      });
    });

    saleReturns.forEach((saleReturn) => {
      const saleReturnPartyId = getRawPartyId(saleReturn.party);
      saleReturn.items.forEach((item) => {
        if (!item.product) return;
        const productKey = String(item.product._id || item.product);
        if (productId && productKey !== String(productId)) return;
        rows.push({
          date: saleReturn.voucherDate,
          entryCreatedAt: saleReturn.createdAt || saleReturn.voucherDate,
          type: 'sale return',
          refId: saleReturn._id,
          refNumber: saleReturn.voucherNumber || '-',
          partyName: resolvePartyName(saleReturnPartyId),
          productId: item.product._id || item.product,
          productName: item.productName || item.product?.name || 'Item',
          inQty: toNumber(item.quantity),
          outQty: 0,
          note: saleReturn.notes || ''
        });
      });
    });

    rows.sort((a, b) => {
      const aDate = new Date(a.date).getTime() || 0;
      const bDate = new Date(b.date).getTime() || 0;
      if (aDate !== bDate) return aDate - bDate;

      const aCreated = new Date(a.entryCreatedAt).getTime() || 0;
      const bCreated = new Date(b.entryCreatedAt).getTime() || 0;
      return aCreated - bCreated;
    });

    const runningByProduct = new Map();
    const ledger = rows.map((row) => {
      const key = String(row.productId);
      const current = runningByProduct.get(key) || 0;
      const next = current + row.inQty - row.outQty;
      runningByProduct.set(key, next);
      return {
        ...row,
        runningQty: next
      };
    });

    const currentStock = products
      .filter((p) => (!productId || String(p._id) === String(productId)))
      .map((p) => ({
        productId: p._id,
        productName: p.name,
        currentStock: toNumber(p.currentStock)
      }));

    res.status(200).json({
      success: true,
      count: ledger.length,
      data: {
        ledger,
        currentStock
      }
    });
  } catch (error) {
    console.error('Stock ledger error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching stock ledger'
    });
  }
};
