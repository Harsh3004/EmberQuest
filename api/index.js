const { createApp } = require('../server/src/app');

// Reuse Express app instance across warm serverless function invocations
let appInstance = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

module.exports = (req, res) => {
  const app = getApp();

  // Vercel rewrite handling:
  // Ensure the Express app receives the full /api/... path if Vercel normalized it
  if (req.headers['x-matched-path'] && !req.url.startsWith('/api')) {
    req.url = req.headers['x-matched-path'];
  }

  return app(req, res);
};
