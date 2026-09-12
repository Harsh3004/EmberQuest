const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-xxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-xxx';

const mockPrisma = {
  user: { findFirst: jest.fn(), create: jest.fn() },
  refreshToken: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
};

jest.mock('../src/prisma/client', () => ({ prisma: mockPrisma }));

const { createApp } = require('../src/app');
const { requireAuth } = require('../src/middleware/auth.middleware');
const { signAccessToken, signRefreshToken, COOKIE_NAME } = require('../src/services/auth.service');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

function fakeUser(overrides = {}) {
  return {
    id: 'user-1',
    username: 'emberhero',
    email: 'hero@ember.quest',
    avatarUrl: null,
    passwordHash: bcrypt.hashSync('secret123', 4),
    level: 1,
    totalXp: 0,
    gold: 0,
    currentStreak: 0,
    longestStreak: 0,
    ...overrides,
  };
}

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

function refreshCookie(token) {
  return `${COOKIE_NAME}=${token}`;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/auth/signup', () => {
  test('201 with user, access token, cookie, and all five skill trees', async () => {
    const user = fakeUser();
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(user);
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const res = await requestApp()
      .post('/api/auth/signup')
      .send({ username: 'emberhero', email: 'hero@ember.quest', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: 'user-1',
      username: 'emberhero',
      email: 'hero@ember.quest',
      avatarUrl: null,
      level: 1,
      totalXp: 0,
      gold: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.headers['set-cookie'].join(';')).toMatch(/eq_refresh=.+;.*HttpOnly/i);

    const created = mockPrisma.user.create.mock.calls[0][0].data;
    expect(created.attributes.create.map((a) => a.name).sort()).toEqual(
      ['Charisma', 'Discipline', 'Intellect', 'Strength', 'Vitality'].sort()
    );
  });

  test('409 EMAIL_TAKEN when email exists, no user created', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ email: 'hero@ember.quest', username: 'other' });

    const res = await requestApp()
      .post('/api/auth/signup')
      .send({ username: 'newhero', email: 'hero@ember.quest', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    expect(res.body.error.field).toBe('email');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test('409 USERNAME_TAKEN when username exists', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ email: 'other@ember.quest', username: 'emberhero' });

    const res = await requestApp()
      .post('/api/auth/signup')
      .send({ username: 'emberhero', email: 'new@ember.quest', password: 'secret123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('USERNAME_TAKEN');
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  test('400 VALIDATION_ERROR with per-field details, DB never touched', async () => {
    const res = await requestApp()
      .post('/api/auth/signup')
      .send({ username: 'x', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.username).toBeDefined();
    expect(res.body.error.details.email).toBeDefined();
    expect(res.body.error.details.password).toBeDefined();
    expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/login', () => {
  test('200 with email identifier', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(fakeUser());
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const res = await requestApp()
      .post('/api/auth/login')
      .send({ identifier: 'hero@ember.quest', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('emberhero');
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.headers['set-cookie'].join(';')).toMatch(/eq_refresh=.+;.*HttpOnly/i);
  });

  test('200 with username identifier', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(fakeUser());
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const res = await requestApp()
      .post('/api/auth/login')
      .send({ identifier: 'emberhero', password: 'secret123' });

    expect(res.status).toBe(200);
  });

  test('401 INVALID_CREDENTIALS on wrong password', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(fakeUser());

    const res = await requestApp()
      .post('/api/auth/login')
      .send({ identifier: 'emberhero', password: 'wrongpass1' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('401 same code for unknown user (no enumeration)', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    const res = await requestApp()
      .post('/api/auth/login')
      .send({ identifier: 'ghost@ember.quest', password: 'whatever12' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/auth/refresh', () => {
  test('rotates session: old token revoked, new cookie + access token issued', async () => {
    const presented = signRefreshToken('user-1');
    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user: fakeUser(),
    });
    mockPrisma.refreshToken.update.mockResolvedValue({});
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const res = await requestApp().post('/api/auth/refresh').set('Cookie', refreshCookie(presented));

    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.user.id).toBe('user-1');
    expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { revoked: true },
    });
    expect(res.headers['set-cookie'].join(';')).toMatch(/eq_refresh=.+;.*HttpOnly/i);
  });

  test('401 when cookie missing', async () => {
    const res = await requestApp().post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_REFRESH_TOKEN');
  });

  test('401 and cookie cleared on tampered token', async () => {
    const res = await requestApp()
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie('tampered.token.value'));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REFRESH_TOKEN');
    expect(res.headers['set-cookie'].join(';')).toMatch(/eq_refresh=;/);
  });

  test('revoked token kills all user sessions (reuse detection)', async () => {
    const presented = signRefreshToken('user-1');
    mockPrisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      userId: 'user-1',
      revoked: true,
      expiresAt: new Date(Date.now() + 60_000),
      user: fakeUser(),
    });
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const res = await requestApp().post('/api/auth/refresh').set('Cookie', refreshCookie(presented));

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('REFRESH_REUSED');
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', revoked: false },
      data: { revoked: true },
    });
  });
});

describe('POST /api/auth/logout', () => {
  test('revokes session, clears cookie, always 200', async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const res = await requestApp()
      .post('/api/auth/logout')
      .set('Cookie', refreshCookie('some-token'));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    expect(res.headers['set-cookie'].join(';')).toMatch(/eq_refresh=;/);
  });

  test('200 even with no cookie (idempotent)', async () => {
    const res = await requestApp().post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('requireAuth middleware', () => {
  test('401 MISSING_TOKEN with no header', () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'MISSING_TOKEN' }) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test('401 INVALID_TOKEN on garbage', () => {
    const req = { headers: { authorization: 'Bearer garbage' } };
    const res = mockRes();
    requireAuth(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_TOKEN' }) })
    );
  });

  test('401 TOKEN_EXPIRED on expired token', () => {
    const expired = jwt.sign(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 60 },
      ACCESS_SECRET
    );
    const req = { headers: { authorization: `Bearer ${expired}` } };
    const res = mockRes();
    requireAuth(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'TOKEN_EXPIRED' }) })
    );
  });

  test('sets req.userId and calls next on valid token', () => {
    const req = { headers: { authorization: `Bearer ${signAccessToken('user-1')}` } };
    const res = mockRes();
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('user-1');
  });
});

// Fresh app per test so the in-memory rate limiter never leaks between tests.
function requestApp() {
  // eslint-disable-next-line global-require
  const request = require('supertest');
  return request(createApp());
}
