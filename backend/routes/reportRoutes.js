const express = require('express');
const router = express.Router();
const {
  getOutstandingReport,
  getPartyLedger,
  getStockLedger
} = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/outstanding', getOutstandingReport);
router.get('/party-ledger', getPartyLedger);
router.get('/stock-ledger', getStockLedger);

module.exports = router;
