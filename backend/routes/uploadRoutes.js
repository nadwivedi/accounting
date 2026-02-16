const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { uploadInvoiceSingle } = require('../utils/multer');
const { uploadInvoice } = require('../controllers/uploadController');

router.use(auth);

router.post('/invoice', (req, res, next) => {
  uploadInvoiceSingle('invoice')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid invoice file'
      });
    }
    next();
  });
}, uploadInvoice);

module.exports = router;
