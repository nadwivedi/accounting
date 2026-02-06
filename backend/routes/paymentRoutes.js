const express = require('express');
const router = express.Router();
const { createPayment, getAllPayments } = require('../controllers/paymentController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createPayment);
router.get('/', getAllPayments);

module.exports = router;
