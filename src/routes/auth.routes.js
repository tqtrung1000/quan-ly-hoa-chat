const express = require('express');
const router = express.Router();
const {
  // registerUser, // Removed registerUser import
  loginUser,
  getUserProfile,
  getUsers,
  createUserByAdmin, // Added createUserByAdmin import
  updatePassword, // Added updatePassword import
  resetPasswordByAdmin, // Added resetPasswordByAdmin import
} = require('../controllers/auth.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// Public routes
// router.post('/register', registerUser); // Removed register route
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile/password', protect, updatePassword); // Added route for updating password
router.get('/users', protect, admin, getUsers);
router.post('/users', protect, admin, createUserByAdmin); // Added route for admin to create users
router.put('/users/:userId/reset-password', protect, admin, resetPasswordByAdmin); // Route for admin to reset password

module.exports = router;
