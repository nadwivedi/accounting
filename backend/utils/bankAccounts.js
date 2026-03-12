const mongoose = require('mongoose');
const Bank = require('../models/master/Bank');

const DEFAULT_CASH_ACCOUNT_NAME = 'Cash Account';

const normalizeBankName = (value) => String(value || '').trim().toLowerCase();

const ensureDefaultBanks = async (userId) => {
  const total = await Bank.countDocuments({ userId });
  if (total > 0) return;

  await Bank.create({
    userId,
    name: DEFAULT_CASH_ACCOUNT_NAME,
    totalBalance: 0,
    notes: 'Default cash account'
  });
};

const getDefaultCashAccount = async (userId) => {
  await ensureDefaultBanks(userId);

  let cashAccount = await Bank.findOne({
    userId,
    name: { $regex: /^cash account$/i }
  });

  if (!cashAccount) {
    cashAccount = await Bank.create({
      userId,
      name: DEFAULT_CASH_ACCOUNT_NAME,
      totalBalance: 0,
      notes: 'Default cash account'
    });
  }

  return cashAccount;
};

const resolveBankAccount = async ({ userId, bankAccountId }) => {
  if (!bankAccountId) {
    return { bankAccount: await getDefaultCashAccount(userId) };
  }

  if (!mongoose.isValidObjectId(bankAccountId)) {
    return { error: 'Invalid bank account id' };
  }

  const bankAccount = await Bank.findOne({ _id: bankAccountId, userId });
  if (!bankAccount) {
    return { error: 'Bank account not found' };
  }

  return { bankAccount };
};

const inferMethodFromBankAccount = (bankAccount, fallback = 'cash') => {
  if (!bankAccount) return fallback;
  return normalizeBankName(bankAccount.name) === normalizeBankName(DEFAULT_CASH_ACCOUNT_NAME)
    ? 'cash'
    : 'bank';
};

module.exports = {
  DEFAULT_CASH_ACCOUNT_NAME,
  ensureDefaultBanks,
  getDefaultCashAccount,
  resolveBankAccount,
  inferMethodFromBankAccount
};
