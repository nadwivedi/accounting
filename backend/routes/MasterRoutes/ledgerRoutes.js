const express = require('express');
const router = express.Router();
const { createLeadger, getAllLeadgers } = require('../../controllers/MasterControllers/ledgerController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createLeadger);
router.get('/', getAllLeadgers);

module.exports = router;

