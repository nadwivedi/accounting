const express = require('express');
const router = express.Router();
const {
  createExpenseGroup,
  getAllExpenseGroups,
  updateExpenseGroup,
  deleteExpenseGroup
} = require('../../controllers/MasterControllers/expenseGroupController');
const auth = require('../../middleware/auth');

router.use(auth);

router.post('/', createExpenseGroup);
router.get('/', getAllExpenseGroups);
router.put('/:id', updateExpenseGroup);
router.delete('/:id', deleteExpenseGroup);

module.exports = router;
