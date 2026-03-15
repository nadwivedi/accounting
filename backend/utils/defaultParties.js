const Party = require('../models/master/Party');
const User = require('../models/User');

const PARTY_TYPES = Object.freeze({
  SUPPLIER: 'supplier',
  CUSTOMER: 'customer',
  CASH_IN_HAND: 'cash-in-hand'
});

const DEFAULT_CASH_PARTY_NAME = 'Cash';

const ensureCashInHandPartyForUser = async (userId) => {
  if (!userId) return null;

  let cashParty = await Party.findOne({
    userId,
    type: PARTY_TYPES.CASH_IN_HAND,
    name: { $regex: /^cash$/i }
  });

  if (!cashParty) {
    cashParty = await Party.create({
      userId,
      type: PARTY_TYPES.CASH_IN_HAND,
      name: DEFAULT_CASH_PARTY_NAME
    });
  }

  return cashParty;
};

const ensureCashInHandPartyForAllUsers = async () => {
  const users = await User.find({}, { _id: 1 }).lean();

  await Promise.all(
    users.map((user) => ensureCashInHandPartyForUser(user._id))
  );
};

module.exports = {
  PARTY_TYPES,
  DEFAULT_CASH_PARTY_NAME,
  ensureCashInHandPartyForUser,
  ensureCashInHandPartyForAllUsers
};
