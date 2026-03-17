const express = require('express');
const router = express.Router();
const {
  getOutstandingReport,
  getPartyLedger,
  getPartyLedgerEntryDetail,
  getStockLedger,
  getDayBookReport
} = require('../controllers/reportController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/outstanding', getOutstandingReport);
router.get('/party-ledger', getPartyLedger);
router.get('/party-ledger-entry-detail', getPartyLedgerEntryDetail);
router.get('/stock-ledger', getStockLedger);
router.get('/day-book', getDayBookReport);

module.exports = router;
