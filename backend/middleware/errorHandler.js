const logger = require('../config/logger');
const ErrorResponse = require('../utils/ErrorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id,
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `Duplicate value entered for '${field}': ${value}. Please use a different value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors (handled in auth middleware, but catch stragglers)
  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Token has expired', 401);
  }

  // Multer file size limit exceeded
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ErrorResponse('File size too large', 400);
  }

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    error = new ErrorResponse('CORS policy violation', 403);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(process.env.NODE_ENV === 'development' && { error: err }),
  });
};

module.exports = errorHandler;
