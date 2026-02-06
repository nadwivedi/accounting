const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Party = require('../models/Party');
const Payment = require('../models/Payment');

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
      notes
    } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required'
      });
    }

    // Check stock availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.currentStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productName}`
        });
      }
    }

    // Calculate total amount from items
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    let partySnapshot = undefined;
    if (party) {
      const partyDoc = await Party.findOne({ _id: party, userId });
      if (!partyDoc) {
        return res.status(404).json({
          success: false,
          message: 'Party not found'
        });
      }
      partySnapshot = {
        partyName: partyDoc.partyName,
        phone: partyDoc.phone,
        email: partyDoc.email,
        gstin: partyDoc.gstin,
        address: partyDoc.address
      };
    }

    const sale = await Sale.create({
      userId,
      party: party || null,
      partySnapshot,
      customerName,
      customerPhone,
      customerAddress,
      items,
      saleDate: saleDate || new Date(),
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      notes
    });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: -item.quantity } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: sale
    });
  } catch (error) {
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
    const { party, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (party) filter.party = party;

    let query = Sale.find(filter)
      .populate('party', 'partyName phone')
      .populate('items.product', 'name');

    if (search) {
      query = query.where('invoiceNumber').regex(new RegExp(search, 'i'));
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
      .populate('party', 'partyName phone email')
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
    const { customerName, customerPhone, customerAddress, notes } = req.body;

    const sale = await Sale.findOneAndUpdate(
      { _id: id, userId },
      { customerName, customerPhone, customerAddress, notes },
      { new: true, runValidators: true }
    )
      .populate('party', 'partyName phone')
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

    // Revert stock updates
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { currentStock: item.quantity } }
      );
    }

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

    const sale = await Sale.findOne({ _id: id, userId });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const newPaidAmount = sale.paidAmount + paidAmount;
    const newBalanceAmount = sale.totalAmount - newPaidAmount;

    const updatedSale = await Sale.findByIdAndUpdate(
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
      party: updatedSale.party || null,
      refType: 'sale',
      refId: updatedSale._id,
      amount: paidAmount,
      paymentDate: new Date()
    });

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
