process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-xxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-xxx';

const mockPrisma = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  attribute: { findMany: jest.fn() },
  activityLog: { findMany: jest.fn() },
};

jest.mock('../src/prisma/client', () => ({ prisma: mockPrisma }));

const { createApp } = require('../src/app');
const { signAccessToken } = require('../src/services/auth.service');

const USER = 'user-1';

function dbUser(overrides = {}) {
  return {
    id: USER,
    username: 'emberhero',
    email: 'hero@ember.quest',
    avatarUrl: null,
    level: 2,
    totalXp: 150,
    gold: 40,
    currentStreak: 6,
    longestStreak: 9,
    lastActiveDay: new Date(),
    ...overrides,
  };
}

function dbAttributes() {
  return [
    { name: 'Strength', level: 3, currentXp: 19 },
    { name: 'Intellect', level: 1, currentXp: 0 },
    { name: 'Vitality', level: 2, currentXp: 10 },
    { name: 'Discipline', level: 1, currentXp: 0 },
    { name: 'Charisma', level: 1, currentXp: 0 },
  ];
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.findUnique.mockResolvedValue(dbUser());
  mockPrisma.attribute.findMany.mockResolvedValue(dbAttributes());
});

function requestApp() {
  // eslint-disable-next-line global-require
  const request = require('supertest');
  return request(createApp());
}

function authed(req) {
  return req.set('Authorization', `Bearer ${signAccessToken(USER)}`);
}

describe('GET /api/character', () => {
  test('200 with user, trees, and XP-to-next-level math', async () => {
    const res = await authed(requestApp().get('/api/character'));

    expect(res.status).toBe(200);
    // L2 needs 283 total: 283 - 150 = 133 to go.
    expect(res.body.character).toMatchObject({
      id: USER,
      username: 'emberhero',
      level: 2,
      totalXp: 150,
      gold: 40,
      currentStreak: 6,
      longestStreak: 9,
      xpToNextLevel: 133,
    });
    expect(res.body.character.attributes).toHaveLength(5);
    // Strength L3 needs 130: 130 - 19 = 111 to go.
    expect(res.body.character.attributes[0]).toMatchObject({
      name: 'Strength',
      level: 3,
      currentXp: 19,
      xpToNextLevel: 111,
    });
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: USER } });
  });

  test('401 without token, DB never touched', async () => {
    const res = await requestApp().get('/api/character');
    expect(res.status).toBe(401);
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  test('404 when the user row is gone', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const res = await authed(requestApp().get('/api/character'));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });
});

describe('PATCH /api/character/avatar', () => {
  test('200 updates the avatar URL', async () => {
    mockPrisma.user.update.mockResolvedValue(dbUser({ avatarUrl: 'https://cdn.example/a.png' }));
    mockPrisma.user.findUnique.mockResolvedValue(dbUser({ avatarUrl: 'https://cdn.example/a.png' }));

    const res = await authed(requestApp().patch('/api/character/avatar')).send({
      avatarUrl: 'https://cdn.example/a.png',
    });

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: USER },
      data: { avatarUrl: 'https://cdn.example/a.png' },
    });
    expect(res.body.character.avatarUrl).toBe('https://cdn.example/a.png');
  });

  test('null clears the avatar', async () => {
    mockPrisma.user.update.mockResolvedValue(dbUser({ avatarUrl: null }));

    const res = await authed(requestApp().patch('/api/character/avatar')).send({ avatarUrl: null });

    expect(res.status).toBe(200);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: USER },
      data: { avatarUrl: null },
    });
  });

  test('400 on non-URL and on missing key, DB never touched', async () => {
    for (const body of [{ avatarUrl: 'not-a-url' }, {}]) {
      const res = await authed(requestApp().patch('/api/character/avatar')).send(body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  test('404 maps Prisma P2025 (user deleted mid-session)', async () => {
    mockPrisma.user.update.mockRejectedValue({ code: 'P2025' });

    const res = await authed(requestApp().patch('/api/character/avatar')).send({
      avatarUrl: 'https://cdn.example/a.png',
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('USER_NOT_FOUND');
  });
});

describe('GET /api/activity-log', () => {
  test('200 newest-first, scoped to caller, default limit 50', async () => {
    const logs = [
      { id: 'l2', action: 'level_up', xpDelta: 0, goldDelta: 0 },
      { id: 'l1', action: 'quest_completed', xpDelta: 105, goldDelta: 25 },
    ];
    mockPrisma.activityLog.findMany.mockResolvedValue(logs);

    const res = await authed(requestApp().get('/api/activity-log'));

    expect(res.status).toBe(200);
    expect(res.body.logs).toEqual(logs);
    expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith({
      where: { userId: USER },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  test('?limit is honored and capped at 100', async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([]);

    const res = await authed(requestApp().get('/api/activity-log?limit=5'));
    expect(res.status).toBe(200);
    expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));

    const bad = await authed(requestApp().get('/api/activity-log?limit=500'));
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });
});
