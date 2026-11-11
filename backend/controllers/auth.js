const crypto = require('crypto');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const logger = require('../config/logger');

// Cookie options
const cookieOptions = {
  expires: new Date(Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000),
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
};

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = user.getSignedJwtToken();

  // Remove sensitive fields
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshTokens;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;
  delete userObj.emailVerificationToken;
  delete userObj.__v;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: userObj,
    });
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public (admin only in production via middleware)
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, department, employeeId } = req.body;

  // Only admin can create admin accounts
  if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
    return next(new ErrorResponse('Only administrators can create admin accounts', 403));
  }

  const user = await User.create({ name, email, password, role: role || 'teacher', department, employeeId });

  // Send verification email in background (non-blocking)
  // This prevents slow SMTP from blocking the registration response
  const sendVerificationEmail = async () => {
    try {
      const verificationToken = user.getEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Attendance Analyzer',
        template: 'emailVerification',
        data: { name: user.name, verificationUrl },
      });
    } catch (emailErr) {
      logger.warn(`Verification email failed for ${user.email}: ${emailErr.message}`);
      // Don't block registration if email fails - user can verify later
    }
  };

  // Fire and forget - don't await, let it run in background
  sendVerificationEmail();

  sendTokenResponse(user, 201, res, 'Registration successful');
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Find user and include password
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    const lockExpiry = new Date(user.lockUntil).toLocaleString();
    return next(new ErrorResponse(`Account locked until ${lockExpiry} due to too many failed attempts`, 423));
  }

  if (!user.isActive) {
    return next(new ErrorResponse('Account deactivated. Contact administrator.', 401));
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
    return next(
      new ErrorResponse(
        attemptsLeft > 0
          ? `Invalid credentials. ${attemptsLeft} attempt(s) remaining before lockout.`
          : 'Account locked for 2 hours due to failed attempts.',
        401
      )
    );
  }

  // Successful login - reset attempts
  await User.findByIdAndUpdate(user._id, {
    loginAttempts: 0,
    $unset: { lockUntil: 1 },
    lastLogin: new Date(),
  });

  logger.info(`User ${user.email} (${user.role}) logged in from IP: ${req.ip}`);

  sendTokenResponse(user, 200, res, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({ success: true, data: user });
});

// @desc    Update password
// @route   PUT /api/v1/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  if (currentPassword === newPassword) {
    return next(new ErrorResponse('New password must be different from current password', 400));
  }

  user.password = newPassword;
  await user.save();

  logger.info(`Password updated for user: ${user.email}`);

  sendTokenResponse(user, 200, res, 'Password updated successfully');
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  // Always return success to prevent email enumeration
  const successMessage = 'If an account with that email exists, a password reset link has been sent.';

  if (!user) {
    return res.status(200).json({ success: true, message: successMessage });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - Attendance Analyzer',
      template: 'resetPassword',
      data: { name: user.name, resetUrl },
    });

    res.status(200).json({ success: true, message: successMessage });
  } catch (err) {
    logger.error(`Reset email failed: ${err.message}`);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash the token from URL params
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  logger.info(`Password reset for user: ${user.email}`);

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// @desc    Verify email
// @route   GET /api/v1/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: 'Email verified successfully' });
});
