const { verifyAccessToken } = require('../services/auth.service');

// Guards every route except /api/auth/* and /api/health.
// Distinct codes let the frontend tell "silent-refresh me" (TOKEN_EXPIRED)
// apart from "send to login" (MISSING_TOKEN / INVALID_TOKEN).
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (!token || scheme !== 'Bearer') {
    return res.status(401).json({ error: { message: 'Access token missing', code: 'MISSING_TOKEN' } });
  }
  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.user = { id: payload.sub };
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ error: { message: 'Access token expired', code: 'TOKEN_EXPIRED' } });
    }
    return res.status(401).json({ error: { message: 'Invalid access token', code: 'INVALID_TOKEN' } });
  }
}

module.exports = { requireAuth };
