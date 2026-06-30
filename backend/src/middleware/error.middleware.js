function notFound(_req, _res, next) {
  const error = new Error('Route not found');
  error.status = 404;
  next(error);
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: {
      message: status >= 500 ? 'Internal server error' : err.message,
      details: err.details
    }
  };

  if (process.env.NODE_ENV !== 'production' && status >= 500) {
    payload.error.message = err.message;
    payload.error.stack = err.stack;
  }

  res.status(status).json(payload);
}

module.exports = {
  notFound,
  errorHandler
};
