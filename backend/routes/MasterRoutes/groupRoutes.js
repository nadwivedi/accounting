const express = require('express');
const router = express.Router();
const {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup
} = require('../../controllers/MasterControllers/groupController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createGroup);
router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

module.exports = router;

