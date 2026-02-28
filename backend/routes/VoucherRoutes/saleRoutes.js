const express = require('express');
const router = express.Router();
const {
  createSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  updatePaymentStatus
} = require('../../controllers/VoucherControllers/saleController');
const auth = require('../../middleware/auth');

// All sale routes are protected
router.use(auth);

router.post('/', createSale);
router.get('/', getAllSales);
router.get('/:id', getSaleById);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);
router.patch('/:id/payment', updatePaymentStatus);

module.exports = router;

