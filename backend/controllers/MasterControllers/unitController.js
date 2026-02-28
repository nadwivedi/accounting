const Unit = require('../../models/master/Unit');
const Product = require('../../models/master/Stock');

const DEFAULT_UNITS = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'hrs', 'minutes'];

const isDuplicateUnitNameError = (error) => (
  error?.code === 11000 && (
    Object.prototype.hasOwnProperty.call(error?.keyPattern || {}, 'name') ||
    Object.prototype.hasOwnProperty.call(error?.keyValue || {}, 'name')
  )
);

const ensureDefaultUnits = async (userId) => {
  const total = await Unit.countDocuments({ userId });
  if (total > 0) return;

  await Unit.insertMany(
    DEFAULT_UNITS.map((name) => ({
      userId,
      name,
      isActive: true
    }))
  );
};

exports.createUnit = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Unit name is required'
      });
    }

    const unit = await Unit.create({
      userId,
      name,
      description,
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: unit
    });
  } catch (error) {
    console.error('Create unit error:', error);
    if (isDuplicateUnitNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Unit name already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating unit'
    });
  }
};

exports.getAllUnits = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const userId = req.userId;

    await ensureDefaultUnits(userId);

    const filter = { userId };

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    let query = Unit.find(filter);

    if (search) {
      query = query.where('name').regex(new RegExp(search, 'i'));
    }

    const units = await query.sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: units.length,
      data: units
    });
  } catch (error) {
    console.error('Get units error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching units'
    });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const unit = await Unit.findOne({ _id: id, userId });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: unit
    });
  } catch (error) {
    console.error('Get unit by id error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching unit'
    });
  }
};

exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, description, isActive } = req.body;

    const unit = await Unit.findOneAndUpdate(
      { _id: id, userId },
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Unit updated successfully',
      data: unit
    });
  } catch (error) {
    console.error('Update unit error:', error);
    if (isDuplicateUnitNameError(error)) {
      return res.status(400).json({
        success: false,
        message: 'Unit name already exists for this user'
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating unit'
    });
  }
};

exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const unitDoc = await Unit.findOne({ _id: id, userId });
    if (!unitDoc) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const linkedProducts = await Product.countDocuments({
      userId,
      unit: String(unitDoc.name || '').trim()
    });

    if (linkedProducts > 0) {
      return res.status(400).json({
        success: false,
        message: 'This unit is used in stock items. Cannot delete.'
      });
    }

    await Unit.deleteOne({ _id: id, userId });

    return res.status(200).json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    console.error('Delete unit error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error deleting unit'
    });
  }
};

