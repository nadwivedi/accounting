const express = require('express');
const router = express.Router();
const { createReceipt, getAllReceipts, updateReceipt } = require('../../controllers/VoucherControllers/receiptController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createReceipt);
router.get('/', getAllReceipts);
router.put('/:id', updateReceipt);

module.exports = router;

