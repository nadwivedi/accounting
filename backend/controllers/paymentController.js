const Payment = require('../models/Payment');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');

const updateInvoicePayment = async (refType, refId, userId, amount) => {
  const Model = refType === 'purchase' ? Purchase : Sale;
  const invoice = await Model.findOne({ _id: refId, userId });

  if (!invoice) {
    return { error: 'Invoice not found' };
  }

  const newPaidAmount = invoice.paidAmount + amount;
  const newBalanceAmount = invoice.totalAmount - newPaidAmount;
  const status = newBalanceAmount <= 0 ? 'paid' : 'partial';

  const updated = await Model.findByIdAndUpdate(
    refId,
    {
      paidAmount: newPaidAmount,
      balanceAmount: Math.max(0, newBalanceAmount),
      paymentStatus: status
    },
    { new: true, runValidators: true }
  );

  return { updated };
};

// Create payment
exports.createPayment = async (req, res) => {
  try {
    const { refType, refId, amount, method, paymentDate, notes, party } = req.body;
    const userId = req.userId;

    if (!refType || !refId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'refType, refId and amount are required'
      });
    }

    if (!['purchase', 'sale'].includes(refType)) {
      return res.status(400).json({
        success: false,
        message: 'refType must be purchase or sale'
      });
    }

    const { updated, error } = await updateInvoicePayment(refType, refId, userId, amount);
    if (error) {
      return res.status(404).json({
        success: false,
        message: error
      });
    }

    const payment = await Payment.create({
      userId,
      party: party || updated.party || null,
      refType,
      refId,
      amount,
      method,
      paymentDate: paymentDate || new Date(),
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: { payment, invoice: updated }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating payment'
    });
  }
};

// Get all payments
exports.getAllPayments = async (req, res) => {
  try {
    const { refType, refId, party } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (refType) filter.refType = refType;
    if (refId) filter.refId = refId;
    if (party) filter.party = party;

    const payments = await Payment.find(filter)
      .populate('party', 'partyName phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching payments'
    });
  }
};
