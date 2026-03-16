const SaleReturn = require('../../models/voucher/SaleReturn');
const mongoose = require('mongoose');
const Sale = require('../../models/voucher/Sales');
const Product = require('../../models/master/Stock');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildReturnedQuantityMap = (returns = []) => {
  const returnedMap = new Map();

  returns.forEach((entry) => {
    (entry.items || []).forEach((item) => {
      const key = String(item.saleItemId || '');
      if (!key) return;
      returnedMap.set(key, (returnedMap.get(key) || 0) + toNumber(item.quantity));
    });
  });

  return returnedMap;
};

exports.createSaleReturn = async (req, res) => {
  try {
    const userId = req.userId;
    const saleId = req.body.sale;
    const voucherDate = req.body.voucherDate ? new Date(req.body.voucherDate) : new Date();
    const notes = String(req.body.notes || '').trim();
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!mongoose.isValidObjectId(saleId)) {
      return res.status(400).json({ success: false, message: 'Valid sale is required' });
    }

    if (requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one return item is required' });
    }

    const sale = await Sale.findOne({ _id: saleId, userId }).populate('items.product', 'name currentStock');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const previousReturns = await SaleReturn.find({ userId, sale: sale._id });
    const returnedQtyMap = buildReturnedQuantityMap(previousReturns);
    const saleItemMap = new Map((sale.items || []).map((item) => [String(item._id), item]));

    const normalizedItems = [];
    let totalAmount = 0;

    for (const requestedItem of requestedItems) {
      const saleItemId = String(requestedItem.saleItemId || '').trim();
      const quantity = toNumber(requestedItem.quantity, NaN);

      if (!saleItemId || !saleItemMap.has(saleItemId)) {
        return res.status(400).json({ success: false, message: 'Invalid sale item selected' });
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Return quantity must be greater than 0' });
      }

      const saleItem = saleItemMap.get(saleItemId);
      const alreadyReturned = returnedQtyMap.get(saleItemId) || 0;
      const maxReturnable = Math.max(0, toNumber(saleItem.quantity) - alreadyReturned);

      if (quantity > maxReturnable) {
        return res.status(400).json({ success: false, message: `Return quantity for ${saleItem.productName} exceeds available returnable quantity` });
      }

      const productId = saleItem.product?._id || saleItem.product;
      const product = await Product.findOne({ _id: productId, userId });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found for ${saleItem.productName}` });
      }

      const unitPrice = toNumber(saleItem.unitPrice);
      const lineTotal = quantity * unitPrice;
      totalAmount += lineTotal;

      normalizedItems.push({
        saleItemId,
        product: productId,
        productName: String(saleItem.productName || saleItem.product?.name || 'Item').trim(),
        soldQuantity: toNumber(saleItem.quantity),
        quantity,
        unitPrice,
        total: lineTotal
      });
    }

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: item.quantity } });
    }

    const saleReturn = await SaleReturn.create({
      userId,
      sale: sale._id,
      party: sale.party || null,
      voucherDate,
      notes,
      items: normalizedItems,
      totalAmount
    });

    const savedEntry = await SaleReturn.findById(saleReturn._id)
      .populate('sale', 'invoiceNumber customerName saleDate')
      .populate('party', 'name')
      .populate('items.product', 'name');

    return res.status(201).json({
      success: true,
      message: 'Sale return voucher created successfully',
      data: savedEntry
    });
  } catch (error) {
    console.error('Create sale return error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error creating sale return voucher' });
  }
};

exports.getAllSaleReturns = async (req, res) => {
  try {
    const userId = req.userId;
    const search = String(req.query.search || '').trim().toLowerCase();

    const entries = await SaleReturn.find({ userId })
      .populate('sale', 'invoiceNumber customerName saleDate')
      .populate('party', 'name')
      .populate('items.product', 'name')
      .sort({ voucherDate: -1, createdAt: -1 });

    const filteredEntries = !search
      ? entries
      : entries.filter((entry) => {
        const haystack = [
          entry.voucherNumber,
          entry.notes,
          entry.sale?.invoiceNumber,
          entry.sale?.customerName,
          entry.party?.name
        ]
          .map((value) => String(value || '').toLowerCase())
          .join(' ');

        return haystack.includes(search);
      });

    return res.status(200).json({
      success: true,
      count: filteredEntries.length,
      data: filteredEntries
    });
  } catch (error) {
    console.error('Get sale return list error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching sale return vouchers' });
  }
};

