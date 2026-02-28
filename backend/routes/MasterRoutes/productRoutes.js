const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock
} = require('../../controllers/MasterControllers/productController');
const auth = require('../../middleware/auth');

// All product routes are protected
router.use(auth);

router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateStock);

module.exports = router;

