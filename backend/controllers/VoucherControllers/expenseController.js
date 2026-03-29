const mongoose = require('mongoose');
const Expense = require('../../models/voucher/Expense');
const ExpenseGroup = require('../../models/master/ExpenseGroup');
const Party = require('../../models/master/Party');

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

exports.createExpense = async (req, res) => {
  try {
    const {
      expenseGroup,
      party,
      amount,
      method,
      expenseDate,
      notes
    } = req.body;
    const userId = req.userId;

    const amountNumber = toNumber(amount, NaN);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    if (!expenseGroup || !mongoose.isValidObjectId(expenseGroup)) {
      return res.status(400).json({
        success: false,
        message: 'Valid expense type is required'
      });
    }

    const existingExpenseGroup = await ExpenseGroup.findOne({ _id: expenseGroup, userId });
    if (!existingExpenseGroup) {
      return res.status(404).json({
        success: false,
        message: 'Expense type not found'
      });
    }

    let resolvedParty = null;
    if (party) {
      if (!mongoose.isValidObjectId(party)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid party id'
        });
      }

      const existingParty = await Party.findOne({ _id: party, userId });
      if (!existingParty) {
        return res.status(404).json({
          success: false,
          message: 'Party not found'
        });
      }
      resolvedParty = existingParty._id;
    }

    const expense = await Expense.create({
      userId,
      expenseGroup: existingExpenseGroup._id,
      party: resolvedParty,
      amount: amountNumber,
      method: method || 'cash',
      expenseDate: expenseDate || new Date(),
      notes: String(notes || '').trim()
    });

    const savedExpense = await Expense.findById(expense._id)
      .populate('expenseGroup', 'name')
      .populate('party', 'name type');

    return res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: savedExpense
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating expense'
    });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const { search, fromDate, expenseGroup, party } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (expenseGroup && mongoose.isValidObjectId(expenseGroup)) {
      filter.expenseGroup = expenseGroup;
    }

    if (party && mongoose.isValidObjectId(party)) {
      filter.party = party;
    }

    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!Number.isNaN(parsedFromDate.getTime())) {
        filter.expenseDate = { $gte: parsedFromDate };
      }
    }

    let expenses = await Expense.find(filter)
      .populate('expenseGroup', 'name')
      .populate('party', 'name type')
      .sort({ expenseDate: -1, createdAt: -1 });

    if (search) {
      const normalizedSearch = String(search || '').trim().toLowerCase();
      expenses = expenses.filter((expense) => {
        const values = [
          expense.expenseGroup?.name,
          expense.party?.name,
          expense.method,
          expense.notes
        ];

        return values.some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
      });
    }

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching expenses'
    });
  }
};
