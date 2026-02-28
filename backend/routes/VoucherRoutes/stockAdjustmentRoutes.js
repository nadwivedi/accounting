const express = require('express');
const router = express.Router();
const {
  createStockAdjustment,
  getAllStockAdjustments
} = require('../../controllers/VoucherControllers/stockAdjustmentController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createStockAdjustment);
router.get('/', getAllStockAdjustments);

module.exports = router;

