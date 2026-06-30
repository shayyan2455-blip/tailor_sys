const httpError = require('../utils/httpError');

function requireAuth(req, _res, next) {
  if (!req.session?.user) {
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
