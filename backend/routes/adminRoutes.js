const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  getCurrentAdmin,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  resetUserPassword,
  accessUser
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.post('/login', login);
router.post('/logout', adminAuth, logout);
router.get('/current', adminAuth, getCurrentAdmin);

router.get('/users', adminAuth, getAllUsers);
router.get('/users/:id', adminAuth, getUserById);
router.post('/users', adminAuth, createUser);
router.put('/users/:id', adminAuth, updateUser);
router.patch('/users/:id/toggle-active', adminAuth, toggleUserActive);
router.patch('/users/:id/reset-password', adminAuth, resetUserPassword);

router.post('/access-user/:id', adminAuth, accessUser);

module.exports = router;
