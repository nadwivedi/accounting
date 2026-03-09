const express = require('express');
const router = express.Router();
const {
  createParty,
  getAllParties,
  updateParty
} = require('../../controllers/MasterControllers/partyController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createParty);
router.get('/', getAllParties);
router.put('/:id', updateParty);

module.exports = router;

