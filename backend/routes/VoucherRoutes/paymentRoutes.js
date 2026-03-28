const express = require('express');
const router = express.Router();
const { createPayment, getAllPayments, updatePayment } = require('../../controllers/VoucherControllers/paymentController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createPayment);
router.get('/', getAllPayments);
router.put('/:id', updatePayment);

module.exports = router;

