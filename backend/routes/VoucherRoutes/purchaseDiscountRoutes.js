const express = require('express');
const router = express.Router();
const {
  createPurchaseDiscount,
  getAllPurchaseDiscounts
} = require('../../controllers/VoucherControllers/purchaseDiscountController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createPurchaseDiscount);
router.get('/', getAllPurchaseDiscounts);

module.exports = router;
