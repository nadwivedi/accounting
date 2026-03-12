export const normalizeBankName = (value) => String(value || '').trim().toLowerCase();

export const getBankDisplayName = (bank) => String(bank?.name || '').trim() || 'Cash Account';

export const getDefaultBankAccountId = (banks = []) => {
  const cashAccount = banks.find((bank) => normalizeBankName(bank?.name) === 'cash account');
  return cashAccount?._id || banks[0]?._id || '';
};

export const getFirstNonCashBankAccountId = (banks = []) => {
  const firstBank = banks.find((bank) => normalizeBankName(bank?.name) !== 'cash account');
  return firstBank?._id || getDefaultBankAccountId(banks);
};

export const inferMethodFromBankId = (banks = [], bankAccountId) => {
  const selectedBank = banks.find((bank) => String(bank._id) === String(bankAccountId));
  if (!selectedBank) return 'cash';
  return normalizeBankName(selectedBank.name) === 'cash account' ? 'cash' : 'bank';
};
