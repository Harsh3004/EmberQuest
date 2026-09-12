process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-xxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-xxx';

// The transaction callback receives this tx client; $transaction just runs it.
const tx = {
  quest: { updateMany: jest.fn(), findFirst: jest.fn() },
  user: { findUnique: jest.fn(), update: jest.fn() },
  attribute: { upsert: jest.fn(), update: jest.fn(), findMany: jest.fn() },
  activityLog: { create: jest.fn() },
};
const mockPrisma = { $transaction: jest.fn((cb) => cb(tx)) };

jest.mock('../src/prisma/client', () => ({ prisma: mockPrisma }));

const { createApp } = require('../src/app');
const { signAccessToken } = require('../src/services/auth.service');

const USER = 'user-1';
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

function hardQuest(overrides = {}) {
  return {
    id: 'quest-1',
    userId: USER,
    title: 'Deadlift PR',
    description: null,
    attribute: 'Strength',
    difficulty: 'HARD',
    xpReward: 100, // stored values rule - the request body is ignored
    goldReward: 25,
    status: 'ACTIVE',
    recurrence: 'NONE',
    dueDate: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function userRow(overrides = {}) {
  return {
    id: USER,
    username: 'emberhero',
    email: 'hero@ember.quest',
    avatarUrl: null,
    level: 1,
    totalXp: 90,
    gold: 10,
    currentStreak: 4,
    longestStreak: 4,
    lastActiveDay: yesterday,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation((cb) => cb(tx));
});

function requestApp() {
  // eslint-disable-next-line global-require
  const request = require('supertest');
  return request(createApp());
}

function authed(req) {
  return req.set('Authorization', `Bearer ${signAccessToken(USER)}`);
}

describe('POST /api/quests/:id/complete', () => {
  test('awards stored rewards + streak bonus, levels up character and attribute', async () => {
    tx.quest.updateMany.mockResolvedValue({ count: 1 });
    tx.quest.findFirst.mockResolvedValue({ ...hardQuest(), status: 'COMPLETED', completedAt: new Date() });
    tx.user.findUnique.mockResolvedValue(userRow());
    tx.attribute.upsert.mockResolvedValue({ id: 'attr-1', userId: USER, name: 'Strength', level: 1, currentXp: 10 });
    tx.user.update.mockImplementation(({ data }) => {
      const base = userRow();
      const increment = data.gold && data.gold.increment ? data.gold.increment : 0;
      return Promise.resolve({ ...base, ...data, gold: base.gold + increment });
    });
    tx.attribute.update.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'attr-1', userId: USER, name: 'Strength', ...data })
    );
    tx.attribute.findMany.mockResolvedValue([
      { name: 'Strength', level: 3, currentXp: 19 },
    ]);
    tx.activityLog.create.mockResolvedValue({});

    const res = await authed(requestApp().post('/api/quests/quest-1/complete'));

    expect(res.status).toBe(200);
    // Streak 4 -> 5 yesterday-consecutive => +5%: 100 XP becomes 105.
    expect(res.body.alreadyCompleted).toBe(false);
    expect(res.body.xpGained).toBe(105);
    expect(res.body.goldGained).toBe(25); // gold never multiplied
    expect(res.body.bonusPercent).toBe(5);
    // Character: 90 + 105 = 195 crosses L1->L2 (100), remainder 95.
    expect(res.body.leveledUp).toBe(true);
    expect(res.body.levelsGained).toBe(1);
    expect(res.body.character.level).toBe(2);
    expect(res.body.character.totalXp).toBe(95);
    expect(res.body.character.gold).toBe(35); // 10 + 25 increment applied
    // Attribute: 10 + 105 = 115 crosses 25 then 71 -> L3 with 19 left.
    expect(res.body.attribute).toMatchObject({ name: 'Strength', level: 3, currentXp: 19, leveledUp: true });
    expect(res.body.streak).toMatchObject({ currentStreak: 5, longestStreak: 5, alreadyActive: false });

    expect(tx.user.update).toHaveBeenCalledWith({
      where: { id: USER },
      data: expect.objectContaining({
        level: 2,
        totalXp: 95,
        gold: { increment: 25 },
        currentStreak: 5,
        longestStreak: 5,
      }),
    });
    // quest_completed always logged; level_up because the character leveled.
    expect(tx.activityLog.create).toHaveBeenCalledTimes(2);
    expect(tx.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'quest_completed', xpDelta: 105, goldDelta: 25 }),
    });
    expect(tx.activityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: 'level_up' }),
    });
  });

  test('request body is ignored - stored rewards win even if client sends fakes', async () => {
    tx.quest.updateMany.mockResolvedValue({ count: 1 });
    tx.quest.findFirst.mockResolvedValue({
      ...hardQuest({ difficulty: 'EASY', xpReward: 25, goldReward: 5, attribute: 'Intellect' }),
      status: 'COMPLETED',
      completedAt: new Date(),
    });
    tx.user.findUnique.mockResolvedValue(userRow({ lastActiveDay: null, currentStreak: 0, totalXp: 0 }));
    tx.attribute.upsert.mockResolvedValue({ id: 'a', userId: USER, name: 'Intellect', level: 1, currentXp: 0 });
    tx.user.update.mockImplementation(({ data }) => Promise.resolve({ ...userRow(), ...data }));
    tx.attribute.update.mockImplementation(({ data }) => Promise.resolve({ id: 'a', name: 'Intellect', ...data }));
    tx.attribute.findMany.mockResolvedValue([]);
    tx.activityLog.create.mockResolvedValue({});

    const res = await authed(requestApp().post('/api/quests/quest-1/complete')).send({ xpReward: 9999, goldReward: 9999 });

    expect(res.status).toBe(200);
    expect(res.body.xpGained).toBe(25);
    expect(res.body.goldGained).toBe(5);
  });

  test('idempotent: completing twice changes nothing the second time', async () => {
    const done = { ...hardQuest(), status: 'COMPLETED', completedAt: yesterday };
    tx.quest.updateMany.mockResolvedValue({ count: 0 }); // claim matches nothing
    tx.quest.findFirst.mockResolvedValue(done);
    tx.user.findUnique.mockResolvedValue(userRow({ level: 2, totalXp: 95 }));
    tx.attribute.findMany.mockResolvedValue([{ name: 'Strength', level: 3, currentXp: 19 }]);

    const res = await authed(requestApp().post('/api/quests/quest-1/complete'));

    expect(res.status).toBe(200);
    expect(res.body.alreadyCompleted).toBe(true);
    expect(res.body.xpGained).toBe(0);
    expect(res.body.leveledUp).toBe(false);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.attribute.update).not.toHaveBeenCalled();
    expect(tx.activityLog.create).not.toHaveBeenCalled();
  });

  test('same-day quest earns no streak change and no bonus', async () => {
    // Same UTC calendar day as "now" (streak math is UTC-based).
    const now = new Date();
    const sameUtcDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1, 0, 0)
    );
    tx.quest.updateMany.mockResolvedValue({ count: 1 });
    tx.quest.findFirst.mockResolvedValue({
      ...hardQuest({ difficulty: 'EASY', xpReward: 25, goldReward: 5 }),
      status: 'COMPLETED',
      completedAt: new Date(),
    });
    tx.user.findUnique.mockResolvedValue(
      userRow({ lastActiveDay: sameUtcDay, currentStreak: 3, longestStreak: 7, totalXp: 0 })
    );
    tx.attribute.upsert.mockResolvedValue({ id: 'a', userId: USER, name: 'Strength', level: 1, currentXp: 0 });
    tx.user.update.mockImplementation(({ data }) => Promise.resolve({ ...userRow(), ...data }));
    tx.attribute.update.mockImplementation(({ data }) => Promise.resolve({ id: 'a', name: 'Strength', ...data }));
    tx.attribute.findMany.mockResolvedValue([]);
    tx.activityLog.create.mockResolvedValue({});

    const res = await authed(requestApp().post('/api/quests/quest-1/complete'));

    expect(res.status).toBe(200);
    expect(res.body.xpGained).toBe(25);
    expect(res.body.bonusPercent).toBe(0);
    expect(res.body.streak).toMatchObject({ currentStreak: 3, longestStreak: 7, alreadyActive: true });
    expect(res.body.leveledUp).toBe(false);
    expect(tx.activityLog.create).toHaveBeenCalledTimes(1); // no level_up log
  });

  test('404 when the quest does not belong to the caller', async () => {
    tx.quest.updateMany.mockResolvedValue({ count: 0 });
    tx.quest.findFirst.mockResolvedValue(null);

    const res = await authed(requestApp().post('/api/quests/nope/complete'));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('QUEST_NOT_FOUND');
    expect(tx.quest.updateMany).toHaveBeenCalledWith({
      where: { id: 'nope', userId: USER, status: 'ACTIVE' },
      data: expect.anything(),
    });
  });

  test('409 when the quest is archived', async () => {
    tx.quest.updateMany.mockResolvedValue({ count: 0 });
    tx.quest.findFirst.mockResolvedValue(hardQuest({ status: 'ARCHIVED' }));
    tx.user.findUnique.mockResolvedValue(userRow());

    const res = await authed(requestApp().post('/api/quests/quest-1/complete'));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('QUEST_LOCKED');
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  test('401 without access token, transaction never starts', async () => {
    const res = await requestApp().post('/api/quests/quest-1/complete');

    expect(res.status).toBe(401);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});
