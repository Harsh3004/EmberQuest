class AppError extends Error {
  constructor(status, message, code = 'APP_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// 404 for unknown /api routes - keeps error shape consistent for the frontend.
function notFoundHandler(_req, res) {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
}

// Central error handler - must be registered last in app.js.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(status).json({ error: { message: err.message || 'Internal error', code } });
}

module.exports = { AppError, notFoundHandler, errorHandler };
