const crypto = require('crypto');

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
  // Skip CSRF for GET, HEAD, OPTIONS requests (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate token for safe methods
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateToken();
    }
    res.locals.csrfToken = req.session.csrfToken;
    return next();
  }

  // Validate CSRF token for unsafe methods (POST, PUT, DELETE, PATCH)
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  
  if (!token) {
    return res.status(403).json({ 
      error: { 
        message: 'CSRF token missing',
        details: 'CSRF token is required for this request'
      }
    });
  }

  if (!req.session.csrfToken || token !== req.session.csrfToken) {
    return res.status(403).json({ 
      error: { 
        message: 'CSRF token invalid',
        details: 'CSRF token validation failed'
      }
    });
  }

  // Regenerate token after successful validation (optional, prevents replay)
  req.session.csrfToken = generateToken();
  res.locals.csrfToken = req.session.csrfToken;
  
  next();
}

module.exports = {
  csrfProtection,
  generateToken
};
