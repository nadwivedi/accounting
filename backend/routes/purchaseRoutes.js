const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase
} = require('../controllers/purchaseController');
const auth = require('../middleware/auth');

// All purchase routes are protected
router.use(auth);

router.post('/', createPurchase);
router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
