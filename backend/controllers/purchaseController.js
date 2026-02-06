const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Payment = require('../models/Payment');

// Create purchase
exports.createPurchase = async (req, res) => {
  try {
    const {
      party,
      items,
      purchaseDate,
      notes
    } = req.body;
    const userId = req.userId;

    if (!party || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Party and at least one item are required'
      });
    }

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const purchase = await Purchase.create({
      userId,
      party,
      items,
      purchaseDate: purchaseDate || new Date(),
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      notes
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: purchase
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
    let filter = { userId };

    if (party) filter.party = party;

    let query = Purchase.find(filter)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    if (search) {
      query = query.where('invoiceNumber').regex(new RegExp(search, 'i'));
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
    const { notes } = req.body;

    const purchase = await Purchase.findOneAndUpdate(
      { _id: id, userId },
      { notes },
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

    // Revert stock updates
    for (const item of purchase.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -item.quantity } }
      );
    }

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

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount } = req.body;
    const userId = req.userId;
    
    if (!paidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Paid amount is required'
      });
    }
    
    const purchase = await Purchase.findOne({ _id: id, userId });
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }
    
    const newPaidAmount = purchase.paidAmount + paidAmount;
    const newBalanceAmount = purchase.totalAmount - newPaidAmount;
    
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      {
        paidAmount: newPaidAmount,
        balanceAmount: newBalanceAmount,
        paymentStatus: newBalanceAmount === 0 ? 'paid' : 'partial'
      },
      { new: true, runValidators: true }
    )
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    await Payment.create({
      userId,
      party: updatedPurchase.party || null,
      refType: 'purchase',
      refId: updatedPurchase._id,
      amount: paidAmount,
      paymentDate: new Date()
    });
      
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
