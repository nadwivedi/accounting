const express = require('express');
const router = express.Router();
const { createPurchaseReturn, getAllPurchaseReturns } = require('../controllers/purchaseReturnController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createPurchaseReturn);
router.get('/', getAllPurchaseReturns);

module.exports = router;
