const express = require('express');
const router = express.Router();
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

// GET all users
router.get('/', asyncHandler(async (req, res) => {
  const { role, isActive, page = 1, limit = 50 } = req.query;
  const query = {};
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);

  res.status(200).json({ success: true, count: users.length, total, data: users });
}));

// GET single user
router.get('/:id', asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.status(200).json({ success: true, data: user });
}));

// Update user role/status
router.put('/:id', asyncHandler(async (req, res, next) => {
  const { role, isActive, name, department } = req.body;

  // Prevent admin from downgrading themselves
  if (req.params.id === req.user._id.toString() && role && role !== 'admin') {
    return next(new ErrorResponse('Cannot change your own admin role', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role, isActive, name, department },
    { new: true, runValidators: true }
  );
  if (!user) return next(new ErrorResponse('User not found', 404));
  res.status(200).json({ success: true, data: user });
}));

// Delete user
router.delete('/:id', asyncHandler(async (req, res, next) => {
  if (req.params.id === req.user._id.toString()) {
    return next(new ErrorResponse('Cannot delete your own account', 400));
  }
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  await user.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted' });
}));

module.exports = router;
