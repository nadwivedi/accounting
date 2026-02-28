const express = require('express');
const router = express.Router();
const {
  createUnit,
  getAllUnits,
  getUnitById,
  updateUnit,
  deleteUnit
} = require('../../controllers/MasterControllers/unitController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createUnit);
router.get('/', getAllUnits);
router.get('/:id', getUnitById);
router.put('/:id', updateUnit);
router.delete('/:id', deleteUnit);

module.exports = router;

