const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, simple } = format;

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'attendance-analyzer' },
  transports: [
    // Write all logs with level 'error' to error.log
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(__dirname, '../logs/rejections.log') }),
  ],
});

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: combine(colorize(), simple()),
  }));
}

module.exports = logger;
