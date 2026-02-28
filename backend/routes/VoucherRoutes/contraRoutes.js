const express = require('express');
const router = express.Router();
const { createContra, getAllContras } = require('../../controllers/VoucherControllers/contraController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createContra);
router.get('/', getAllContras);

module.exports = router;

