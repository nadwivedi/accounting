const mongoose = require('mongoose');
const Leadger = require('../../models/master/Part');
const Group = require('../../models/master/Group');

exports.createLeadger = async (req, res) => {
  try {
    const {
      group,
      name,
      notes
    } = req.body;
    const userId = req.userId;

    if (!group || !mongoose.isValidObjectId(group)) {
      return res.status(400).json({
        success: false,
        message: 'Valid group is required'
      });
    }

    const groupDoc = await Group.findOne({ _id: group, userId, isActive: true });
    if (!groupDoc) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!String(name || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'Leadger name is required'
      });
    }

    const leadger = await Leadger.create({
      userId,
      group,
      name: String(name || '').trim(),
      notes: String(notes || '').trim()
    });

    const populatedLeadger = await Leadger.findById(leadger._id)
      .populate('group', 'name');

    return res.status(201).json({
      success: true,
      message: 'Leadger voucher created successfully',
      data: populatedLeadger
    });
  } catch (error) {
    console.error('Create leadger error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating leadger voucher'
    });
  }
};

exports.getAllLeadgers = async (req, res) => {
  try {
    const { group, search } = req.query;
    const userId = req.userId;
    const filter = { userId };

    if (group && mongoose.isValidObjectId(group)) {
      filter.group = group;
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { notes: searchRegex }
      ];
    }

    const leadgers = await Leadger.find(filter)
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leadgers.length,
      data: leadgers
    });
  } catch (error) {
    console.error('Get leadgers error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching leadger vouchers'
    });
  }
};

