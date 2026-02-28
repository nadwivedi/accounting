const StockGroup = require('../../models/master/StockGroup');

const isDuplicateStockGroupNameError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'name') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'name')
  )
);

// Create stock group
exports.createStockGroup = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Stock group name is required'
      });
    }

    const stockGroup = await StockGroup.create({
      userId,
      name,
      description,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Stock group created successfully',
      data: stockGroup
    });
  } catch (error) {
    console.error('Create stock group error:', error);
    if (isDuplicateStockGroupNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Stock group name already exists for this user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating stock group'
    });
  }
};

// Get all stock groups
exports.getAllStockGroups = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    let query = StockGroup.find(filter);

    if (search) {
      query = query.where('name').regex(new RegExp(search, 'i'));
    }

    const stockGroups = await query.sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stockGroups.length,
      data: stockGroups
    });
  } catch (error) {
    console.error('Get all stock groups error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching stock groups'
    });
  }
};

// Get stock group by ID
exports.getStockGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const stockGroup = await StockGroup.findOne({ _id: id, userId });

    if (!stockGroup) {
      return res.status(404).json({
        success: false,
        message: 'Stock group not found'
      });
    }

    res.status(200).json({
      success: true,
      data: stockGroup
    });
  } catch (error) {
    console.error('Get stock group by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching stock group'
    });
  }
};

// Update stock group
exports.updateStockGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, description, isActive } = req.body;

    const stockGroup = await StockGroup.findOneAndUpdate(
      { _id: id, userId },
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!stockGroup) {
      return res.status(404).json({
        success: false,
        message: 'Stock group not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock group updated successfully',
      data: stockGroup
    });
  } catch (error) {
    console.error('Update stock group error:', error);
    if (isDuplicateStockGroupNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Stock group name already exists for this user'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating stock group'
    });
  }
};

// Delete stock group
exports.deleteStockGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const stockGroup = await StockGroup.findOneAndDelete({ _id: id, userId });

    if (!stockGroup) {
      return res.status(404).json({
        success: false,
        message: 'Stock group not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock group deleted successfully'
    });
  } catch (error) {
    console.error('Delete stock group error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting stock group'
    });
  }
};

