const mongoose = require('mongoose');
const Sale = require('../models/voucher/Sales');
const Purchase = require('../models/voucher/Purchase');
const PurchaseReturn = require('../models/voucher/PurchaseReturn');
const SaleReturn = require('../models/voucher/SaleReturn');
const Payment = require('../models/voucher/Payment');
const Receipt = require('../models/voucher/Receipt');
const Product = require('../models/master/Stock');
const Party = require('../models/master/Party');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const withDateFilters = (filter, dateField, fromDate, toDate) => {
  if (!fromDate && !toDate) return;
  filter[dateField] = {};
  if (fromDate) filter[dateField].$gte = new Date(fromDate);
  if (toDate) filter[dateField].$lte = new Date(toDate);
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
        refNumber: sale.invoiceNumber,
        partyId: salePartyId || null,
        partyName: sale.customerName || resolvePartyName(salePartyId, salePartyId ? 'Account' : 'Walk-in'),
        amount: toNumber(sale.totalAmount),
        impact: toNumber(sale.totalAmount),
        quantity: getTotalQuantity(sale.items),
        itemSummary: getItemSummary(sale.items),
        method: sale.paymentMode || '',
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
        refNumber: receipt.refId || null,
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
        refNumber: purchase.supplierInvoice || purchase.invoiceNo || purchase.invoiceNumber || '-',
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
        amount: toNumber(saleReturn.amount),
        impact: -toNumber(saleReturn.amount),
        quantity: 0,
        itemSummary: '',
        method: saleReturn.method || '',
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
        refNumber: payment.refId || null,
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
    withDateFilters(purchaseFilter, 'purchaseDate', fromDate, toDate);
    withDateFilters(saleFilter, 'saleDate', fromDate, toDate);
    withDateFilters(purchaseReturnFilter, 'voucherDate', fromDate, toDate);

    const [purchases, sales, purchaseReturns, products] = await Promise.all([
      Purchase.find(purchaseFilter).populate('items.product', 'name'),
      Sale.find(saleFilter).populate('items.product', 'name'),
      PurchaseReturn.find(purchaseReturnFilter).populate('items.product', 'name'),
      Product.find({ userId }, 'name currentStock')
    ]);

    const rows = [];

    purchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        if (!item.product) return;
        const productKey = String(item.product._id);
        if (productId && productKey !== String(productId)) return;
        rows.push({
          date: purchase.purchaseDate,
          entryCreatedAt: purchase.createdAt || purchase.purchaseDate,
          type: 'purchase',
          refId: purchase._id,
          refNumber: purchase.supplierInvoice || purchase.invoiceNo || purchase.invoiceNumber || '-',
          productId: item.product._id,
          productName: item.product.name,
          inQty: toNumber(item.quantity),
          outQty: 0,
          note: purchase.notes || ''
        });
      });
    });

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!item.product) return;
        const productKey = String(item.product._id);
        if (productId && productKey !== String(productId)) return;
        rows.push({
          date: sale.saleDate,
          entryCreatedAt: sale.createdAt || sale.saleDate,
          type: 'sale',
          refId: sale._id,
          refNumber: sale.invoiceNumber,
          productId: item.product._id,
          productName: item.product.name,
          inQty: 0,
          outQty: toNumber(item.quantity),
          note: sale.notes || ''
        });
      });
    });

    purchaseReturns.forEach((purchaseReturn) => {
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
          productId: item.product._id || item.product,
          productName: item.productName || item.product?.name || 'Item',
          inQty: 0,
          outQty: toNumber(item.quantity),
          note: purchaseReturn.notes || ''
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
