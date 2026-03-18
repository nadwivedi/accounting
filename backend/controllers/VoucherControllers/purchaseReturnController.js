const mongoose = require('mongoose');
const PurchaseReturn = require('../../models/voucher/PurchaseReturn');
const Purchase = require('../../models/voucher/Purchase');
const Product = require('../../models/master/Stock');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getNextPurchaseReturnVoucherNumber = async (userId) => {
  const entries = await PurchaseReturn.find({ userId })
    .select('voucherNumber createdAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  const nextNumber = entries.reduce((max, entry) => {
    const match = String(entry?.voucherNumber || '').trim().match(/^prt-(\d+)$/i);
    const parsed = match ? Number.parseInt(match[1], 10) : null;
    if (!Number.isInteger(parsed) || parsed <= 0) return max;
    return Math.max(max, parsed);
  }, 0) + 1;

  return `PRT-${String(nextNumber).padStart(2, '0')}`;
};

const buildReturnedQuantityMap = (returns = []) => {
  const returnedMap = new Map();

  returns.forEach((entry) => {
    (entry.items || []).forEach((item) => {
      const key = String(item.purchaseItemId || '');
      if (!key) return;
      returnedMap.set(key, (returnedMap.get(key) || 0) + toNumber(item.quantity));
    });
  });

  return returnedMap;
};

exports.createPurchaseReturn = async (req, res) => {
  try {
    const userId = req.userId;
    const purchaseId = req.body.purchase;
    const voucherDate = req.body.voucherDate ? new Date(req.body.voucherDate) : new Date();
    const notes = String(req.body.notes || '').trim();
    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];

    if (!mongoose.isValidObjectId(purchaseId)) {
      return res.status(400).json({ success: false, message: 'Valid purchase is required' });
    }

    if (requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one return item is required' });
    }

    const purchase = await Purchase.findOne({ _id: purchaseId, userId }).populate('items.product', 'name currentStock');
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const previousReturns = await PurchaseReturn.find({ userId, purchase: purchase._id });
    const returnedQtyMap = buildReturnedQuantityMap(previousReturns);
    const purchaseItemMap = new Map((purchase.items || []).map((item) => [String(item._id), item]));

    const normalizedItems = [];
    let totalAmount = 0;

    for (const requestedItem of requestedItems) {
      const purchaseItemId = String(requestedItem.purchaseItemId || '').trim();
      const quantity = toNumber(requestedItem.quantity, NaN);

      if (!purchaseItemId || !purchaseItemMap.has(purchaseItemId)) {
        return res.status(400).json({ success: false, message: 'Invalid purchase item selected' });
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Return quantity must be greater than 0' });
      }

      const purchaseItem = purchaseItemMap.get(purchaseItemId);
      const alreadyReturned = returnedQtyMap.get(purchaseItemId) || 0;
      const maxReturnable = Math.max(0, toNumber(purchaseItem.quantity) - alreadyReturned);

      if (quantity > maxReturnable) {
        return res.status(400).json({ success: false, message: `Return quantity for ${purchaseItem.productName} exceeds available returnable quantity` });
      }

      const productId = purchaseItem.product?._id || purchaseItem.product;
      const product = await Product.findOne({ _id: productId, userId });
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found for ${purchaseItem.productName}` });
      }

      if (toNumber(product.currentStock) < quantity) {
        return res.status(400).json({ success: false, message: `Insufficient current stock for ${purchaseItem.productName} to process return` });
      }

      const unitPrice = toNumber(purchaseItem.unitPrice);
      const lineTotal = quantity * unitPrice;
      totalAmount += lineTotal;

      normalizedItems.push({
        purchaseItemId,
        product: productId,
        productName: String(purchaseItem.productName || purchaseItem.product?.name || 'Item').trim(),
        purchasedQuantity: toNumber(purchaseItem.quantity),
        quantity,
        unitPrice,
        total: lineTotal
      });
    }

    for (const item of normalizedItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { currentStock: -item.quantity } });
    }

    const voucherNumber = await getNextPurchaseReturnVoucherNumber(userId);

    const purchaseReturn = await PurchaseReturn.create({
      userId,
      voucherNumber,
      purchase: purchase._id,
      party: purchase.party || null,
      voucherDate,
      notes,
      items: normalizedItems,
      totalAmount
    });

    const savedEntry = await PurchaseReturn.findById(purchaseReturn._id)
      .populate('purchase', 'purchaseNumber supplierInvoice purchaseDate')
      .populate('party', 'name')
      .populate('items.product', 'name');

    return res.status(201).json({
      success: true,
      message: 'Purchase return voucher created successfully',
      data: savedEntry
    });
  } catch (error) {
    console.error('Create purchase return error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error creating purchase return voucher' });
  }
};

exports.getAllPurchaseReturns = async (req, res) => {
  try {
    const userId = req.userId;
    const search = String(req.query.search || '').trim();

    let query = PurchaseReturn.find({ userId })
      .populate('purchase', 'purchaseNumber supplierInvoice purchaseDate')
      .populate('party', 'name')
      .populate('items.product', 'name');

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query = query.where({
        $or: [
          { voucherNumber: searchRegex },
          { notes: searchRegex }
        ]
      });
    }

    const entries = await query.sort({ voucherDate: -1, createdAt: -1 });
    return res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    console.error('Get purchase return list error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error fetching purchase return vouchers' });
  }
};
