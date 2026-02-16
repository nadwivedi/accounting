const express = require('express');
const router = express.Router();
const { createReceipt, getAllReceipts } = require('../controllers/receiptController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createReceipt);
router.get('/', getAllReceipts);

module.exports = router;
