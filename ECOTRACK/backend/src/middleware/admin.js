'use strict';

/**
 * Admin authorization middleware.
 * Must be used AFTER requireAuth — requires req.profile.role === 'admin'.
 */
function requireAdmin(req, res, next) {
  if (!req.profile || req.profile.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Administrator privileges are required.' });
  }
  next();
}

module.exports = { requireAdmin };
