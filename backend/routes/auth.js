const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin, validate } = require('../validators/auth');

router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);
router.get('/verify-email/:token', verifyEmail);

module.exports = router;
