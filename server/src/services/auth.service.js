const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ACCESS_TTL = '15m';
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches REFRESH_TTL below
const REFRESH_TTL = '7d';
const COOKIE_NAME = 'eq_refresh';
const BCRYPT_COST = 10;

// Every new character starts with all five Skill Trees at level 1.
const SKILL_TREES = ['Strength', 'Intellect', 'Vitality', 'Discipline', 'Charisma'];

// Secrets are read lazily so tests can set env vars before first use,
// and a missing secret fails loud (500) instead of signing with undefined.
function getSecrets() {
  const access = process.env.JWT_ACCESS_SECRET;
  const refresh = process.env.JWT_REFRESH_SECRET;
  if (!access || !refresh) throw new Error('JWT secrets are not configured');
  return { access, refresh };
}

function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, getSecrets().access, { expiresIn: ACCESS_TTL });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, getSecrets().refresh, { expiresIn: REFRESH_TTL });
}

// Throws TokenExpiredError / JsonWebTokenError - callers map to 401 codes.
function verifyAccessToken(token) {
  return jwt.verify(token, getSecrets().access);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getSecrets().refresh);
}

// Only the hash is stored - a DB leak never yields usable refresh tokens.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function refreshExpiry() {
  return new Date(Date.now() + REFRESH_TTL_MS);
}

function cookieOptions() {
  return {
    httpOnly: true, // never readable from JS - XSS cannot steal it
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth', // cookie is only sent to auth routes
    maxAge: REFRESH_TTL_MS,
  };
}

function clearCookieOptions() {
  const options = cookieOptions();
  delete options.maxAge; // clearCookie controls expiry itself
  return options;
}

// Never leak passwordHash (or internals) over the wire.
function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    level: user.level,
    totalXp: user.totalXp,
    gold: user.gold,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
  };
}

module.exports = {
  ACCESS_TTL,
  REFRESH_TTL_MS,
  COOKIE_NAME,
  SKILL_TREES,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  hashPassword,
  verifyPassword,
  refreshExpiry,
  cookieOptions,
  clearCookieOptions,
  publicUser,
};
