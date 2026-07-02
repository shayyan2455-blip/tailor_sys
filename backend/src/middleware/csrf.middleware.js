const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generate a CSRF token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * CSRF protection middleware
 * Generates and validates CSRF tokens using session
 */
function csrfProtection(req, res, next) {
  // Ensure session exists
  if (!req.session) {
    return next(new Error('Session middleware is required for CSRF protection'));
  }

  // Generate token if it doesn't exist in session
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  // Always set the CSRF token in a non-httpOnly cookie so frontend can read it
  res.cookie('XSRF-TOKEN', req.session.csrfToken, {
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  // Skip validation for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.locals.csrfToken = req.session.csrfToken;
    return next();
  }

  // Validate CSRF token for unsafe methods (POST, PUT, DELETE, PATCH)
  const token = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({ 
      error: { 
        message: 'CSRF token missing',
        details: 'CSRF token is required for this request'
      }
    });
  }

  if (token !== req.session.csrfToken) {
    return res.status(403).json({ 
      error: { 
        message: 'CSRF token invalid',
        details: 'CSRF token validation failed'
      }
    });
  }

  res.locals.csrfToken = req.session.csrfToken;
  next();
}

module.exports = {
  csrfProtection,
  generateToken
};
