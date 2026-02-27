const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const Product = require('../models/Stock');
const Party = require('../models/Party');
const StockAdjustment = require('../models/StockAdjustment');

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

exports.getOutstandingReport = async (req, res) => {
  try {
    const userId = req.userId;

    const [sales, purchases, payments, receipts, parties] = await Promise.all([
      Sale.find({ userId }).populate('party', 'partyName'),
      Purchase.find({ userId }).populate('party', 'partyName'),
      Payment.find({ userId }),
      Receipt.find({ userId }),
      Party.find({ userId }, 'partyName type')
    ]);

    const salePending = sales
      .map((sale) => {
        const pending = Math.max(0, toNumber(sale.totalAmount) - toNumber(sale.paidAmount));
        return {
          id: sale._id,
          invoiceNumber: sale.invoiceNumber,
          date: sale.saleDate,
          partyId: sale.party?._id || null,
          partyName: sale.party?.partyName || sale.customerName || 'Walk-in',
          totalAmount: toNumber(sale.totalAmount),
          paidAmount: toNumber(sale.paidAmount),
          pendingAmount: pending,
          type: 'sale'
        };
      })
      .filter((row) => row.pendingAmount > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const purchasePending = purchases
      .map((purchase) => {
        const pending = Math.max(
          0,
          toNumber(
            purchase.balanceAmount,
            toNumber(purchase.totalAmount) - toNumber(purchase.paidAmount)
          )
        );
        return {
          id: purchase._id,
          invoiceNo: purchase.invoiceNo || purchase.invoiceNumber || '-',
          date: purchase.purchaseDate,
          partyId: purchase.party?._id || null,
          partyName: purchase.party?.partyName || '-',
          totalAmount: toNumber(purchase.totalAmount),
          paidAmount: toNumber(purchase.paidAmount),
          pendingAmount: pending,
          type: 'purchase'
        };
      })
      .filter((row) => row.pendingAmount > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const partyMap = new Map();
    parties.forEach((party) => {
      partyMap.set(String(party._id), {
        partyId: party._id,
        partyName: party.partyName,
        type: party.type,
        totalSales: 0,
        totalReceipts: 0,
        totalPurchases: 0,
        totalPayments: 0,
        receivable: 0,
        payable: 0,
        netBalance: 0
      });
    });

    sales.forEach((sale) => {
      if (!sale.party) return;
      const key = String(sale.party._id || sale.party);
      const row = partyMap.get(key);
      if (!row) return;
      row.totalSales += toNumber(sale.totalAmount);
    });

    receipts.forEach((receipt) => {
      if (!receipt.party) return;
      const key = String(receipt.party);
      const row = partyMap.get(key);
      if (!row) return;
      row.totalReceipts += toNumber(receipt.amount);
    });

    purchases.forEach((purchase) => {
      if (!purchase.party) return;
      const key = String(purchase.party._id || purchase.party);
      const row = partyMap.get(key);
      if (!row) return;
      row.totalPurchases += toNumber(purchase.totalAmount);
    });

    payments.forEach((payment) => {
      if (!payment.party) return;
      const key = String(payment.party);
      const row = partyMap.get(key);
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
    const paymentFilter = { userId };
    const receiptFilter = { userId };

    if (partyId) {
      saleFilter.party = partyId;
      purchaseFilter.party = partyId;
      paymentFilter.party = partyId;
      receiptFilter.party = partyId;
    }

    withDateFilters(saleFilter, 'saleDate', fromDate, toDate);
    withDateFilters(purchaseFilter, 'purchaseDate', fromDate, toDate);
    withDateFilters(paymentFilter, 'paymentDate', fromDate, toDate);
    withDateFilters(receiptFilter, 'receiptDate', fromDate, toDate);

    const [sales, purchases, payments, receipts] = await Promise.all([
      Sale.find(saleFilter).populate('party', 'partyName'),
      Purchase.find(purchaseFilter).populate('party', 'partyName'),
      Payment.find(paymentFilter).populate('party', 'partyName'),
      Receipt.find(receiptFilter).populate('party', 'partyName')
    ]);

    const entries = [];

    sales.forEach((sale) => {
      entries.push({
        date: sale.saleDate,
        entryCreatedAt: sale.createdAt || sale.saleDate,
        type: 'sale',
        refId: sale._id,
        refNumber: sale.invoiceNumber,
        partyId: sale.party?._id || null,
        partyName: sale.party?.partyName || sale.customerName || 'Walk-in',
        amount: toNumber(sale.totalAmount),
        impact: toNumber(sale.totalAmount), // increases receivable
        note: sale.notes || ''
      });
    });

    receipts.forEach((receipt) => {
      entries.push({
        date: receipt.receiptDate,
        entryCreatedAt: receipt.createdAt || receipt.receiptDate,
        type: 'receipt',
        refId: receipt._id,
        refNumber: receipt.refId || null,
        partyId: receipt.party?._id || null,
        partyName: receipt.party?.partyName || '-',
        amount: toNumber(receipt.amount),
        impact: -toNumber(receipt.amount), // reduces receivable
        note: receipt.notes || ''
      });
    });

    purchases.forEach((purchase) => {
      entries.push({
        date: purchase.purchaseDate,
        entryCreatedAt: purchase.createdAt || purchase.purchaseDate,
        type: 'purchase',
        refId: purchase._id,
        refNumber: purchase.invoiceNo || purchase.invoiceNumber || '-',
        partyId: purchase.party?._id || null,
        partyName: purchase.party?.partyName || '-',
        amount: toNumber(purchase.totalAmount),
        impact: -toNumber(purchase.totalAmount), // increases payable
        note: purchase.notes || ''
      });
    });

    payments.forEach((payment) => {
      entries.push({
        date: payment.paymentDate,
        entryCreatedAt: payment.createdAt || payment.paymentDate,
        type: 'payment',
        refId: payment._id,
        refNumber: payment.refId || null,
        partyId: payment.party?._id || null,
        partyName: payment.party?.partyName || '-',
        amount: toNumber(payment.amount),
        impact: toNumber(payment.amount), // reduces payable
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
    const adjustmentFilter = { userId };

    withDateFilters(purchaseFilter, 'purchaseDate', fromDate, toDate);
    withDateFilters(saleFilter, 'saleDate', fromDate, toDate);
    withDateFilters(adjustmentFilter, 'adjustmentDate', fromDate, toDate);

    const [purchases, sales, adjustments, products] = await Promise.all([
      Purchase.find(purchaseFilter).populate('items.product', 'name'),
      Sale.find(saleFilter).populate('items.product', 'name'),
      StockAdjustment.find(adjustmentFilter).populate('product', 'name'),
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
          refNumber: purchase.invoiceNo || purchase.invoiceNumber || '-',
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

    adjustments.forEach((adjustment) => {
      if (!adjustment.product) return;
      const adjustmentProductId = String(adjustment.product._id || adjustment.product);
      if (productId && adjustmentProductId !== String(productId)) return;

      const quantity = toNumber(adjustment.quantity);
      const isAdd = adjustment.type === 'add';

      rows.push({
        date: adjustment.adjustmentDate || adjustment.createdAt,
        entryCreatedAt: adjustment.createdAt || adjustment.adjustmentDate,
        type: 'adjustment',
        refId: adjustment._id,
        refNumber: `ADJ-${String(adjustment._id).slice(-6).toUpperCase()}`,
        productId: adjustment.product._id,
        productName: adjustment.product.name,
        inQty: isAdd ? quantity : 0,
        outQty: isAdd ? 0 : quantity,
        note: adjustment.notes || ''
      });
    });

    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

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
