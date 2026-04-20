const express = require('express');
const router = express.Router();
const {
  register,
  login,
  employeeLogin,
  logout,
  getCurrentUser,
  updateUserSettings,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/employee-login', employeeLogin);
router.post('/logout', logout);

// Protected routes
router.get('/current', auth, getCurrentUser);
router.put('/settings', auth, updateUserSettings);
router.get('/', auth, getAllUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.post('/:id/change-password', auth, changePassword);
router.delete('/:id', auth, deleteUser);

module.exports = router;
