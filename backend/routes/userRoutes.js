const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
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

// Protected routes
router.get('/current', auth, getCurrentUser);
router.get('/', auth, getAllUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.post('/:id/change-password', auth, changePassword);
router.delete('/:id', auth, deleteUser);

module.exports = router;
