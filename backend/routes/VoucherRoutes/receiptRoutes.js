const express = require('express');
const router = express.Router();
const { createReceipt, getAllReceipts, updateReceipt, deleteReceipt } = require('../../controllers/VoucherControllers/receiptController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createReceipt);
router.get('/', getAllReceipts);
router.put('/:id', updateReceipt);
router.delete('/:id', deleteReceipt);

module.exports = router;

