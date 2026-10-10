'use strict';
/**
 * Centralized error handler middleware for Express.
 * Must be registered AFTER all routes.
 */
module.exports = function errorHandler(err, req, res, next) {
  // Never log or expose credential-related tokens
  const safeMessage = err.message || 'An unexpected error occurred.';
  const status = err.status || err.statusCode || 500;

  // Log full error server-side (without sensitive headers)
  console.error(`[errorHandler] ${req.method} ${req.path} → ${status}: ${safeMessage}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error.' : safeMessage,
  });
};
