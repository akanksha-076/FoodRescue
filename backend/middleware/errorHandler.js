const multer = require('multer');
const ApiError = require('../utils/ApiError');

/**
 * Global Express error handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || null;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image size must be 5 MB or less.' : err.message;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'record';
    message = `An entry with this ${duplicateField} already exists.`;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    message = errors[0]?.message || 'Validation failed';
  } else if (!(err instanceof ApiError) && process.env.NODE_ENV === 'production') {
    message = 'An unexpected server error occurred.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]', err);
  }

  const payload = {
    success: false,
    message,
  };
  if (errors) payload.errors = errors;

  return res.status(statusCode).json(payload);
};

module.exports = errorHandler;
