const Product = require('../models/Product');

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      unit,
      minStockLevel,
      taxRate,
      isActive
    } = req.body;
    const userId = req.userId;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    const product = await Product.create({
      userId,
      name,
      category,
      unit: unit || 'pcs',
      minStockLevel: minStockLevel || 10,
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
    const { category, isActive, search } = req.query;
    const userId = req.userId;
    let filter = { userId };

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    let query = Product.find(filter).populate('category', 'name');

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

    const product = await Product.findOne({ _id: id, userId }).populate('category', 'name');

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
    const updateData = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

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

    if (!quantity || !type || !['add', 'subtract'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'quantity and type (add/subtract) are required'
      });
    }

    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (type === 'subtract' && product.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${product.currentStock}`
      });
    }

    if (type === 'add') {
      product.currentStock += quantity;
    } else {
      product.currentStock -= quantity;
    }

    await product.save();

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
