const express = require('express');
const {
  getEmployees,
  addEmployee,
  updateEmployee,
  resetEmployeePassword,
  deleteEmployee,
  changeOwnPassword
} = require('../controllers/employeeController');
const auth = require('../middleware/auth');

const router = express.Router();

const requireOwner = (req, res, next) => {
    if (req.employee) {
        return res.status(403).json({ success: false, message: 'Staff accounts cannot manage employees.' });
    }
    next();
};

router.use(auth);

// Employee self-service: change own password (no requireOwner guard)
router.post('/me/change-password', changeOwnPassword);

router.use(requireOwner);

router.get('/', getEmployees);
router.post('/', addEmployee);
router.put('/:id', updateEmployee);
router.patch('/:id/reset-password', resetEmployeePassword);
router.delete('/:id', deleteEmployee);

module.exports = router;
