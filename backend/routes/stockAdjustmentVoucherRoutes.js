const express = require('express');
const router = express.Router();
const {
  createStockAdjustmentVoucher,
  getAllStockAdjustmentVouchers
} = require('../controllers/stockAdjustmentVoucherController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createStockAdjustmentVoucher);
router.get('/', getAllStockAdjustmentVouchers);

module.exports = router;
