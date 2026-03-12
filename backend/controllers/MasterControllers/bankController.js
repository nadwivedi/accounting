const Bank = require('../../models/master/Bank');
const {
  DEFAULT_CASH_ACCOUNT_NAME,
  ensureDefaultBanks
} = require('../../utils/bankAccounts');

const isDuplicateBankNameError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'name') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'name')
  )
);

const normalizeBalance = (value) => {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

exports.createBank = async (req, res) => {
  try {
    const { name, totalBalance, notes } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Bank name is required'
      });
    }

    const normalizedBalance = normalizeBalance(totalBalance);
    if (Number.isNaN(normalizedBalance)) {
      return res.status(400).json({
        success: false,
        message: 'Total balance must be a valid number'
      });
    }

    const bank = await Bank.create({
      userId,
      name,
      totalBalance: normalizedBalance,
      notes
    });

    return res.status(201).json({
      success: true,
      message: 'Bank created successfully',
      data: bank
    });
  } catch (error) {
    console.error('Create bank error:', error);
    if (isDuplicateBankNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Bank name already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating bank'
    });
  }
};

exports.getAllBanks = async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.userId;

    await ensureDefaultBanks(userId);

    let query = Bank.find({ userId });

    if (search) {
      query = query.where('name').regex(new RegExp(search, 'i'));
    }

    const banks = await query.sort({ createdAt: -1 });
    const sortedBanks = [...banks].sort((firstBank, secondBank) => {
      const firstIsCash = String(firstBank.name || '').toLowerCase() === DEFAULT_CASH_ACCOUNT_NAME.toLowerCase();
      const secondIsCash = String(secondBank.name || '').toLowerCase() === DEFAULT_CASH_ACCOUNT_NAME.toLowerCase();

      if (firstIsCash === secondIsCash) {
        return new Date(secondBank.createdAt).getTime() - new Date(firstBank.createdAt).getTime();
      }

      return firstIsCash ? -1 : 1;
    });

    return res.status(200).json({
      success: true,
      count: sortedBanks.length,
      data: sortedBanks
    });
  } catch (error) {
    console.error('Get banks error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching banks'
    });
  }
};

exports.getBankById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const bank = await Bank.findOne({ _id: id, userId });

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: bank
    });
  } catch (error) {
    console.error('Get bank by id error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching bank'
    });
  }
};

exports.updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, totalBalance, notes } = req.body;

    const normalizedBalance = normalizeBalance(totalBalance);
    if (Number.isNaN(normalizedBalance)) {
      return res.status(400).json({
        success: false,
        message: 'Total balance must be a valid number'
      });
    }

    const bank = await Bank.findOneAndUpdate(
      { _id: id, userId },
      {
        name,
        totalBalance: normalizedBalance,
        notes
      },
      { new: true, runValidators: true }
    );

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bank updated successfully',
      data: bank
    });
  } catch (error) {
    console.error('Update bank error:', error);
    if (isDuplicateBankNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Bank name already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating bank'
    });
  }
};

exports.deleteBank = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const bank = await Bank.findOneAndDelete({ _id: id, userId });

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Bank deleted successfully'
    });
  } catch (error) {
    console.error('Delete bank error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting bank'
    });
  }
};
