const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');

// Protect routes - verify JWT
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check httpOnly cookie
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB (ensures token belongs to active user)
    const user = await User.findById(decoded.id).select('-password -refreshTokens');

    if (!user) {
      return next(new ErrorResponse('User not found', 401));
    }

    if (!user.isActive) {
      return next(new ErrorResponse('Your account has been deactivated. Contact administrator.', 401));
    }

    if (user.isLocked) {
      return next(new ErrorResponse('Account is temporarily locked due to multiple failed login attempts', 423));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Token expired, please login again', 401));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ErrorResponse('Invalid token', 401));
    }
    return next(new ErrorResponse('Not authorized', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Optional auth - attach user if token present, but don't block
exports.optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore invalid/expired tokens in optional auth
    }
  }

  next();
});
