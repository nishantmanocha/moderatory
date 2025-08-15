const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Default error response
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Specific error types
  if (err.code === 'SQLITE_CONSTRAINT') {
    error.message = 'Database constraint violation';
    error.status = 400;
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    error.message = 'Resource already exists';
    error.status = 409;
  }

  if (err.name === 'ValidationError') {
    error.message = 'Invalid input data';
    error.status = 400;
    error.details = err.details;
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.stack;
    if (error.status === 500) {
      error.message = 'Something went wrong';
    }
  } else {
    error.stack = err.stack;
  }

  res.status(error.status).json({
    error: true,
    ...error
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map(detail => detail.message);
      return next(validationError);
    }
    next();
  };
};

module.exports = {
  errorHandler,
  asyncHandler,
  validateRequest
};