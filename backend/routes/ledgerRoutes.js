const express = require('express');
const router = express.Router();
const { createLeadger, getAllLeadgers } = require('../controllers/ledgerController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createLeadger);
router.get('/', getAllLeadgers);

module.exports = router;
