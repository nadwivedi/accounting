const Group = require('../models/Group');
const Leadger = require('../models/Leadger');

const DEFAULT_GROUPS = [
  { name: 'Sundry Debtors', description: 'Customer outstanding accounts' },
  { name: 'Sundry Creditors', description: 'Supplier outstanding accounts' },
  { name: 'Cash-in-Hand', description: 'Cash accounts' },
  { name: 'Bank Accounts', description: 'Bank accounts' }
];

const isDuplicateGroupNameError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'name') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'name')
  )
);

const ensureDefaultGroups = async (userId) => {
  const total = await Group.countDocuments({ userId });
  if (total > 0) return;

  await Group.insertMany(
    DEFAULT_GROUPS.map((group) => ({
      userId,
      name: group.name,
      description: group.description,
      isActive: true
    }))
  );
};

exports.createGroup = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    const group = await Group.create({
      userId,
      name,
      description,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Create group error:', error);
    if (isDuplicateGroupNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Group name already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating group'
    });
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const userId = req.userId;

    await ensureDefaultGroups(userId);

    const filter = { userId };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    let query = Group.find(filter);

    if (search) {
      query = query.where('name').regex(new RegExp(search, 'i'));
    }

    const groups = await query.sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching groups'
    });
  }
};

exports.getGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const group = await Group.findOne({ _id: id, userId });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Get group by id error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching group'
    });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, description, isActive } = req.body;

    const group = await Group.findOneAndUpdate(
      { _id: id, userId },
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      data: group
    });
  } catch (error) {
    console.error('Update group error:', error);
    if (isDuplicateGroupNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Group name already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating group'
    });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const linkedLeadgerCount = await Leadger.countDocuments({ userId, group: id });
    if (linkedLeadgerCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This group is used in leadger vouchers. Cannot delete.'
      });
    }

    const group = await Group.findOneAndDelete({ _id: id, userId });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting group'
    });
  }
};
