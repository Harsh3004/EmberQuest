const { prisma } = require('../prisma/client');
const {
  COOKIE_NAME,
  SKILL_TREES,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  hashPassword,
  verifyPassword,
  refreshExpiry,
  cookieOptions,
  clearCookieOptions,
  publicUser,
} = require('../services/auth.service');

function conflict(status, message, code, extra = {}) {
  return { status, body: { error: { message, code, ...extra } } };
}

// Prisma race fallback: two simultaneous signups with the same value.
// P2002 target looks like ['email'] or ['username'].
function uniqueConflict(err) {
  if (err && err.code === 'P2002') {
    const target = (err.meta && err.meta.target) || [];
    if (target.includes('email')) return conflict(409, 'Email already registered', 'EMAIL_TAKEN', { field: 'email' });
    if (target.includes('username')) return conflict(409, 'Username already taken', 'USERNAME_TAKEN', { field: 'username' });
    return conflict(409, 'Already exists', 'CONFLICT');
  }
  return null;
}

async function issueSession(res, userId) {
  const refreshToken = signRefreshToken(userId);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiry() },
  });
  res.cookie(COOKIE_NAME, refreshToken, cookieOptions());
  return refreshToken;
}

async function signup(req, res, next) {
  try {
    const { username, email, password, avatarUrl } = req.body;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
      select: { email: true, username: true },
    });
    if (existing) {
      const c =
        existing.email === email
          ? conflict(409, 'Email already registered', 'EMAIL_TAKEN', { field: 'email' })
          : conflict(409, 'Username already taken', 'USERNAME_TAKEN', { field: 'username' });
      return res.status(c.status).json(c.body);
    }
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: await hashPassword(password),
        avatarUrl: avatarUrl ?? null,
        attributes: { create: SKILL_TREES.map((name) => ({ name })) },
      },
    });
    await issueSession(res, user.id);
    return res.status(201).json({ user: publicUser(user), accessToken: signAccessToken(user.id) });
  } catch (err) {
    const c = uniqueConflict(err);
    if (c) return res.status(c.status).json(c.body);
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });
    // Same response for unknown user and wrong password - no enumeration.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });
    }
    await issueSession(res, user.id);
    return res.json({ user: publicUser(user), accessToken: signAccessToken(user.id) });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const presented = req.cookies && req.cookies[COOKIE_NAME];
    if (!presented) {
      return res
        .status(401)
        .json({ error: { message: 'Refresh token missing', code: 'MISSING_REFRESH_TOKEN' } });
    }
    try {
      verifyRefreshToken(presented);
    } catch {
      res.clearCookie(COOKIE_NAME, clearCookieOptions());
      return res
        .status(401)
        .json({ error: { message: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' } });
    }
    const row = await prisma.refreshToken.findFirst({
      where: { tokenHash: hashToken(presented) },
      include: { user: true },
    });
    if (!row || !row.user) {
      res.clearCookie(COOKIE_NAME, clearCookieOptions());
      return res
        .status(401)
        .json({ error: { message: 'Session not found - please log in again', code: 'INVALID_REFRESH_TOKEN' } });
    }
    if (row.revoked || row.expiresAt <= new Date()) {
      // Reuse of a dead token can mean theft: kill every session for this user.
      await prisma.refreshToken.updateMany({
        where: { userId: row.userId, revoked: false },
        data: { revoked: true },
      });
      res.clearCookie(COOKIE_NAME, clearCookieOptions());
      return res
        .status(401)
        .json({ error: { message: 'Session expired - please log in again', code: 'REFRESH_REUSED' } });
    }
    // Rotate: the presented token is single-use from here on.
    await prisma.refreshToken.update({ where: { id: row.id }, data: { revoked: true } });
    await issueSession(res, row.userId);
    return res.json({ user: publicUser(row.user), accessToken: signAccessToken(row.userId) });
  } catch (err) {
    return next(err);
  }
}

// Idempotent: always 200 with the cookie cleared, session revoked best-effort.
async function logout(req, res, next) {
  try {
    const presented = req.cookies && req.cookies[COOKIE_NAME];
    if (presented) {
      await prisma.refreshToken
        .updateMany({
          where: { tokenHash: hashToken(presented), revoked: false },
          data: { revoked: true },
        })
        .catch(() => {});
    }
    res.clearCookie(COOKIE_NAME, clearCookieOptions());
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = { signup, login, refresh, logout };
