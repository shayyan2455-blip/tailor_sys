const httpError = require('../utils/httpError');
const logger = require('../utils/logger');

function requireAuth(req, _res, next) {
  logger.debug({ sessionId: req.sessionID, sessionExists: !!req.session, userExists: !!req.session?.user }, 'Auth check');
  if (!req.session?.user) {
    logger.warn({ sessionId: req.sessionID, cookies: req.cookies }, 'Authentication failed - no user in session');
    return next(httpError(401, 'Authentication required'));
  }
  return next();
}

function requireRole(...roles) {
  return function roleGuard(req, _res, next) {
    const role = req.session?.user?.role;
    if (!role || !roles.includes(role)) {
      return next(httpError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
