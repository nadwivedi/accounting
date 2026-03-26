const express = require('express');
const router = express.Router();
const {
  createSaleDiscount,
  getAllSaleDiscounts
} = require('../../controllers/VoucherControllers/saleDiscountController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createSaleDiscount);
router.get('/', getAllSaleDiscounts);

module.exports = router;
