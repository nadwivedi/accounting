const Product = require('../models/Stock');
const StockAdjustment = require('../models/StockAdjustment');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      stockGroup,
      unit,
      minStockLevel,
      purchasePrice,
      salePrice,
      taxRate,
      isActive
    } = req.body;
    const userId = req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    const normalizedStockGroup = stockGroup ? stockGroup : null;

    const product = await Product.create({
      userId,
      name,
      stockGroup: normalizedStockGroup,
      unit: unit || 'pcs',
      minStockLevel: minStockLevel || 10,
      purchasePrice: Number(purchasePrice || 0),
      salePrice: Number(salePrice || 0),
      taxRate: taxRate || 0,
      isActive: isActive !== undefined ? isActive : true
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
    const { stockGroup, isActive, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (stockGroup) filter.stockGroup = stockGroup;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    let query = Product.find(filter).populate('stockGroup', 'name');

    if (search) {
      query = query.where('name').regex(new RegExp(search, 'i'));
    }

    const products = await query.sort({ createdAt: -1 });

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
    if (Object.prototype.hasOwnProperty.call(updateData, 'purchasePrice')) {
      updateData.purchasePrice = Number(updateData.purchasePrice || 0);
    }
    if (Object.prototype.hasOwnProperty.call(updateData, 'salePrice')) {
      updateData.salePrice = Number(updateData.salePrice || 0);
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
    const { quantity, type, notes, adjustmentDate } = req.body;
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
    const stockAfter = Number(product.currentStock || 0);

    await StockAdjustment.create({
      userId,
      product: product._id,
      type,
      quantity: normalizedQuantity,
      stockBefore,
      stockAfter,
      notes: String(notes || '').trim(),
      adjustmentDate: adjustmentDate ? new Date(adjustmentDate) : new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating stock'
    });
  }
};
