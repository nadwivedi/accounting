const express = require('express');
const router = express.Router();
const {
  createStockGroup,
  getAllStockGroups,
  getStockGroupById,
  updateStockGroup,
  deleteStockGroup
} = require('../controllers/stockGroupController');
const auth = require('../middleware/auth');

// All stock group routes are protected
router.use(auth);

router.post('/', createStockGroup);
router.get('/', getAllStockGroups);
router.get('/:id', getStockGroupById);
router.put('/:id', updateStockGroup);
router.delete('/:id', deleteStockGroup);

module.exports = router;
