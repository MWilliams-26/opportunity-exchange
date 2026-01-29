const config = require('../config');

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function notFoundHandler(req, res, next) {
  next(new NotFoundError('Endpoint'));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  if (req.log) {
    if (statusCode >= 500) {
      req.log.error({ err, url: req.url, method: req.method }, 'Server error');
    } else if (statusCode >= 400) {
      req.log.warn({ err, url: req.url, method: req.method }, 'Client error');
    }
  } else {
    console.error(err);
  }

  const response = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isOperational ? err.message : 'Something went wrong',
    },
  };

  if (err.field) {
    response.error.field = err.field;
  }

  if (config.isDev && !isOperational) {
    response.error.stack = err.stack;
    response.error.message = err.message;
  }

  res.status(statusCode).json(response);
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
};
