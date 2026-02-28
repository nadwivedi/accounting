const express = require('express');
const router = express.Router();
const { createSaleReturn, getAllSaleReturns } = require('../../controllers/VoucherControllers/saleReturnController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createSaleReturn);
router.get('/', getAllSaleReturns);

module.exports = router;

