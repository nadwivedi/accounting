const mongoose = require('mongoose');
const Party = require('../../models/master/Party');
const { PARTY_TYPES } = require('../../utils/defaultParties');

const normalizeType = (value) => String(value || '').trim().toLowerCase();
const normalizeOpeningBalance = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
};
const normalizeOpeningBalanceType = (partyType, openingBalanceType, openingBalance) => {
  const normalizedExplicitType = String(openingBalanceType || '').trim().toLowerCase();
  if (normalizedExplicitType === 'receivable' || normalizedExplicitType === 'payable') {
    return normalizedExplicitType;
  }

  const numericBalance = Number(openingBalance);
  if (Number.isFinite(numericBalance) && numericBalance !== 0) {
    if (partyType === PARTY_TYPES.SUPPLIER) {
      return numericBalance >= 0 ? 'payable' : 'receivable';
    }
    return numericBalance >= 0 ? 'receivable' : 'payable';
  }

  return partyType === PARTY_TYPES.SUPPLIER ? 'payable' : 'receivable';
};

const isValidPartyType = (value) => (
  value === PARTY_TYPES.SUPPLIER
  || value === PARTY_TYPES.CUSTOMER
  || value === PARTY_TYPES.CASH_IN_HAND
);

exports.createParty = async (req, res) => {
  try {
    const {
      type,
      name,
      mobile,
      email,
      address,
      state,
      pincode,
      openingBalance,
      openingBalanceType
    } = req.body;
    const userId = req.userId;

    const normalizedType = normalizeType(type);
    if (!isValidPartyType(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid party type is required (supplier, customer, or cash in hand)'
      });
    }

    if (!String(name || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Party name is required'
      });
    }

    const normalizedOpeningBalance = normalizeOpeningBalance(openingBalance);
    const normalizedOpeningBalanceType = normalizeOpeningBalanceType(
      normalizedType,
      openingBalanceType,
      openingBalance
    );

    const party = await Party.create({
      userId,
      type: normalizedType,
      name: String(name || '').trim(),
      mobile: String(mobile || '').trim(),
      email: String(email || '').trim(),
      address: String(address || '').trim(),
      state: String(state || '').trim(),
      pincode: String(pincode || '').trim(),
      openingBalance: normalizedOpeningBalance,
      openingBalanceType: normalizedOpeningBalanceType
    });

    return res.status(201).json({
      success: true,
      message: 'Party created successfully',
      data: party
    });
  } catch (error) {
    console.error('Create party error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating party'
    });
  }
};

exports.getAllParties = async (req, res) => {
  try {
    const { type, search } = req.query;
    const userId = req.userId;
    const filter = { userId };

    const normalizedType = normalizeType(type);
    if (normalizedType) {
      if (!isValidPartyType(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid party type filter'
        });
      }
      filter.type = normalizedType;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { address: searchRegex },
        { state: searchRegex },
        { pincode: searchRegex }
      ];
    }

    const parties = await Party.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: parties.length,
      data: parties
    });
  } catch (error) {
    console.error('Get parties error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching parties'
    });
  }
};

exports.updateParty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      type,
      name,
      mobile,
      email,
      address,
      state,
      pincode,
      openingBalance,
      openingBalanceType
    } = req.body;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid party id is required'
      });
    }

    const normalizedType = normalizeType(type);
    if (!isValidPartyType(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid party type is required (supplier, customer, or cash in hand)'
      });
    }

    if (!String(name || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Party name is required'
      });
    }

    const normalizedOpeningBalance = normalizeOpeningBalance(openingBalance);
    const normalizedOpeningBalanceType = normalizeOpeningBalanceType(
      normalizedType,
      openingBalanceType,
      openingBalance
    );

    const party = await Party.findOneAndUpdate(
      { _id: id, userId },
      {
        type: normalizedType,
        name: String(name || '').trim(),
        mobile: String(mobile || '').trim(),
        email: String(email || '').trim(),
        address: String(address || '').trim(),
        state: String(state || '').trim(),
        pincode: String(pincode || '').trim(),
        openingBalance: normalizedOpeningBalance,
        openingBalanceType: normalizedOpeningBalanceType
      },
      { new: true, runValidators: true }
    );

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Party updated successfully',
      data: party
    });
  } catch (error) {
    console.error('Update party error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating party'
    });
  }
};
