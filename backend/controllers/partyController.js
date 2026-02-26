const Party = require('../models/Party');

// Create party
exports.createParty = async (req, res) => {
  try {
    const {
      partyName,
      type,
      phone,
      email,
      partyImg,
      address,
      gstin,
      panNumber,
      openingBalance,
      creditLimit,
      isActive
    } = req.body;
    const userId = req.userId;

    if (!partyName || !type) {
      return res.status(400).json({
        success: false,
        message: 'partyName and type are required'
      });
    }

    const party = await Party.create({
      userId,
      partyName,
      type,
      phone,
      email,
      partyImg: partyImg || '',
      address,
      gstin,
      panNumber,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
      creditLimit: creditLimit || 0,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Party created successfully',
      data: party
    });
  } catch (error) {
    console.error('Create party error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating party'
    });
  }
};

// Get all parties
exports.getAllParties = async (req, res) => {
  try {
    const { type, isActive, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (type === 'customer') {
      filter.type = { $in: ['customer', 'both'] };
    } else if (type === 'supplier') {
      filter.type = { $in: ['supplier', 'both'] };
    } else if (type) {
      filter.type = type;
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    let query = Party.find(filter);

    if (search) {
      query = query.where({
        $or: [
          { partyName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const parties = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: parties.length,
      data: parties
    });
  } catch (error) {
    console.error('Get all parties error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching parties'
    });
  }
};

// Get party by ID
exports.getPartyById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const party = await Party.findOne({ _id: id, userId });

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    res.status(200).json({
      success: true,
      data: party
    });
  } catch (error) {
    console.error('Get party by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching party'
    });
  }
};

// Update party
exports.updateParty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    const party = await Party.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Party updated successfully',
      data: party
    });
  } catch (error) {
    console.error('Update party error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating party'
    });
  }
};

// Delete party
exports.deleteParty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const party = await Party.findOneAndDelete({ _id: id, userId });

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Party deleted successfully'
    });
  } catch (error) {
    console.error('Delete party error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting party'
    });
  }
};

// Update balance
exports.updateBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { amount, type } = req.body;

    if (amount === undefined || !type || !['add', 'subtract'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'amount and type (add/subtract) are required'
      });
    }

    const party = await Party.findOne({ _id: id, userId });

    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    if (type === 'add') {
      party.currentBalance += amount;
    } else {
      party.currentBalance -= amount;
    }

    await party.save();

    res.status(200).json({
      success: true,
      message: 'Balance updated successfully',
      data: party
    });
  } catch (error) {
    console.error('Update balance error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating balance'
    });
  }
};
