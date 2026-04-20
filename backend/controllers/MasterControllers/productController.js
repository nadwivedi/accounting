const Product = require('../../models/master/Stock');
const Unit = require('../../models/master/Unit');
const User = require('../../models/User');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      stockGroup,
      unit,
      typeOfSupply,
      minStockLevel,
      purchasePrice,
      salePrice,
      taxRate,
      trackExpiry
    } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const normalizedUnit = String(unit || 'pcs').trim();
    if (!normalizedUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit is required'
      });
    }

    const unitDoc = await Unit.findOne({
      userId,
      name: normalizedUnit,
      isActive: true
    });

    if (!unitDoc) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid active unit'
      });
    }

    const normalizedTypeOfSupply = String(typeOfSupply || 'goods').trim().toLowerCase();
    if (!['goods', 'services'].includes(normalizedTypeOfSupply)) {
      return res.status(400).json({
        success: false,
        message: 'Type of supply must be goods or services'
      });
    }

    const normalizedStockGroup = stockGroup ? stockGroup : null;
    const normalizedMinStockLevel = (
      minStockLevel !== undefined
      && minStockLevel !== null
      && String(minStockLevel).trim() !== ''
    ) ? Number(minStockLevel) : 0;

    const shouldTrackExpiry = trackExpiry === undefined
      ? Boolean((await User.findById(userId).select('userSettings.expiryAlert').lean())?.userSettings?.expiryAlert)
      : Boolean(trackExpiry);

    const product = await Product.create({
      userId,
      name,
      stockGroup: normalizedStockGroup,
      unit: normalizedUnit,
      typeOfSupply: normalizedTypeOfSupply,
      minStockLevel: normalizedMinStockLevel,
      purchasePrice: Number(purchasePrice || 0),
      salePrice: Number(salePrice || 0),
      taxRate: taxRate || 0,
      trackExpiry: shouldTrackExpiry
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating product'
    });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { stockGroup, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (stockGroup) filter.stockGroup = stockGroup;

    let query = Product.find(filter)
      .populate('stockGroup', 'name')
      .select('name unit stockGroup currentStock minStockLevel salePrice taxRate typeOfSupply trackExpiry');

    if (search) {
      query = query.where('name').regex(new RegExp(search, 'i'));
    }

    const products = await query.sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching products'
    });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOne({ _id: id, userId }).populate('stockGroup', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching product'
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updateData, 'stockGroup')) {
      updateData.stockGroup = updateData.stockGroup ? updateData.stockGroup : null;
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'unit')) {
      const normalizedUnit = String(updateData.unit || '').trim();
      if (!normalizedUnit) {
        return res.status(400).json({
          success: false,
          message: 'Unit is required'
        });
      }

      const unitDoc = await Unit.findOne({
        userId,
        name: normalizedUnit,
        isActive: true
      });

      if (!unitDoc) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid active unit'
        });
      }

      updateData.unit = normalizedUnit;
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'typeOfSupply')) {
      const normalizedTypeOfSupply = String(updateData.typeOfSupply || '').trim().toLowerCase();
      if (!normalizedTypeOfSupply || !['goods', 'services'].includes(normalizedTypeOfSupply)) {
        return res.status(400).json({
          success: false,
          message: 'Type of supply must be goods or services'
        });
      }
      updateData.typeOfSupply = normalizedTypeOfSupply;
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'purchasePrice')) {
      updateData.purchasePrice = Number(updateData.purchasePrice || 0);
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'salePrice')) {
      updateData.salePrice = Number(updateData.salePrice || 0);
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'trackExpiry')) {
      updateData.trackExpiry = Boolean(updateData.trackExpiry);
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('stockGroup', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const product = await Product.findOneAndDelete({ _id: id, userId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting product'
    });
  }
};

// Update stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { quantity, type } = req.body;
    const normalizedQuantity = Number(quantity);

    if (!type || !['add', 'subtract'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'quantity and type (add/subtract) are required'
      });
    }

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const stockBefore = Number(product.currentStock || 0);

    if (type === 'subtract' && stockBefore < normalizedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.currentStock}`
      });
    }

    if (type === 'add') {
      product.currentStock = stockBefore + normalizedQuantity;
    } else {
      product.currentStock = stockBefore - normalizedQuantity;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: { _id: product._id, currentStock: product.currentStock }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating stock'
    });
  }
};

