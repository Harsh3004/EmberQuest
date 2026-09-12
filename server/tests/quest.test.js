process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-xxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-xxx';

const mockPrisma = {
  quest: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../src/prisma/client', () => ({ prisma: mockPrisma }));

const { createApp } = require('../src/app');
const { signAccessToken } = require('../src/services/auth.service');

function activeQuest(overrides = {}) {
  return {
    id: 'quest-1',
    userId: 'user-1',
    title: 'Morning run',
    description: null,
    attribute: 'Vitality',
    difficulty: 'MEDIUM',
    xpReward: 50,
    goldReward: 12,
    status: 'ACTIVE',
    recurrence: 'NONE',
    dueDate: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// Fresh app per call so the in-memory rate limiter never leaks between tests.
function requestApp() {
  // eslint-disable-next-line global-require
  const request = require('supertest');
  return request(createApp());
}

function authed(req) {
  return req.set('Authorization', `Bearer ${signAccessToken('user-1')}`);
}

describe('quest auth guard', () => {
  test('401 without access token', async () => {
    const res = await requestApp().get('/api/quests');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MISSING_TOKEN');
    expect(mockPrisma.quest.findMany).not.toHaveBeenCalled();
  });
});

describe('POST /api/quests', () => {
  test('201 assigns server-side rewards from difficulty', async () => {
    mockPrisma.quest.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'quest-1', ...data, completedAt: null, createdAt: new Date().toISOString() })
    );

    const res = await authed(requestApp().post('/api/quests')).send({
      title: 'Deadlift PR',
      attribute: 'Strength',
      difficulty: 'HARD',
    });

    expect(res.status).toBe(201);
    expect(res.body.quest.xpReward).toBe(100);
    expect(res.body.quest.goldReward).toBe(25);
    expect(mockPrisma.quest.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1' }) })
    );
  });

  test('difficulty defaults to EASY (25 XP / 5 gold)', async () => {
    mockPrisma.quest.create.mockImplementation(({ data }) => Promise.resolve({ id: 'q', ...data }));

    const res = await authed(requestApp().post('/api/quests')).send({
      title: 'Read 10 pages',
      attribute: 'Intellect',
    });

    expect(res.status).toBe(201);
    expect(res.body.quest.difficulty).toBe('EASY');
    expect(res.body.quest.xpReward).toBe(25);
    expect(res.body.quest.goldReward).toBe(5);
  });

  test('client-supplied rewards are ignored, never trusted', async () => {
    mockPrisma.quest.create.mockImplementation(({ data }) => Promise.resolve({ id: 'q', ...data }));

    const res = await authed(requestApp().post('/api/quests')).send({
      title: 'Sneaky quest',
      attribute: 'Strength',
      difficulty: 'TRIVIAL',
      xpReward: 9999,
      goldReward: 9999,
    });

    expect(res.status).toBe(201);
    expect(res.body.quest.xpReward).toBe(10);
    expect(res.body.quest.goldReward).toBe(2);
  });

  test('400 on whitespace-only title, DB never touched', async () => {
    const res = await authed(requestApp().post('/api/quests')).send({
      title: '   ',
      attribute: 'Strength',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.title).toBeDefined();
    expect(mockPrisma.quest.create).not.toHaveBeenCalled();
  });

  test('400 on unknown attribute', async () => {
    const res = await authed(requestApp().post('/api/quests')).send({
      title: 'Weird quest',
      attribute: 'Luck',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.details.attribute).toBeDefined();
    expect(mockPrisma.quest.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/quests', () => {
  test('defaults to active quests', async () => {
    mockPrisma.quest.findMany.mockResolvedValue([activeQuest()]);

    const res = await authed(requestApp().get('/api/quests'));

    expect(res.status).toBe(200);
    expect(res.body.quests).toHaveLength(1);
    expect(mockPrisma.quest.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  });

  test('?status=completed returns completed quests', async () => {
    mockPrisma.quest.findMany.mockResolvedValue([]);

    const res = await authed(requestApp().get('/api/quests?status=completed'));

    expect(res.status).toBe(200);
    expect(res.body.quests).toEqual([]);
    expect(mockPrisma.quest.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
    });
  });

  test('400 on unknown status filter', async () => {
    const res = await authed(requestApp().get('/api/quests?status=archived'));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockPrisma.quest.findMany).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/quests/:id', () => {
  test('200 edits fields and recomputes rewards on difficulty change', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(activeQuest());
    mockPrisma.quest.update.mockImplementation(({ data }) =>
      Promise.resolve(activeQuest({ ...data }))
    );

    const res = await authed(requestApp().patch('/api/quests/quest-1')).send({
      title: 'Evening run',
      difficulty: 'EPIC',
    });

    expect(res.status).toBe(200);
    expect(mockPrisma.quest.update).toHaveBeenCalledWith({
      where: { id: 'quest-1' },
      data: expect.objectContaining({
        title: 'Evening run',
        difficulty: 'EPIC',
        xpReward: 200,
        goldReward: 60,
      }),
    });
  });

  test('lookup is scoped to the caller (no cross-user edits)', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(null);

    const res = await authed(requestApp().patch('/api/quests/other-users-quest')).send({
      title: 'Hijack',
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('QUEST_NOT_FOUND');
    expect(mockPrisma.quest.findFirst).toHaveBeenCalledWith({
      where: { id: 'other-users-quest', userId: 'user-1' },
    });
    expect(mockPrisma.quest.update).not.toHaveBeenCalled();
  });

  test('400 when status is sent - it can only change via complete', async () => {
    const res = await authed(requestApp().patch('/api/quests/quest-1')).send({ status: 'COMPLETED' });

    expect(res.status).toBe(400);
    expect(res.body.error.details.status).toBeDefined();
    expect(mockPrisma.quest.findFirst).not.toHaveBeenCalled();
  });

  test('409 QUEST_LOCKED on completed quest, no update issued', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(activeQuest({ status: 'COMPLETED' }));

    const res = await authed(requestApp().patch('/api/quests/quest-1')).send({ title: 'Rewrite history' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('QUEST_LOCKED');
    expect(mockPrisma.quest.update).not.toHaveBeenCalled();
  });

  test('client-supplied xpReward on edit is ignored', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(activeQuest());
    mockPrisma.quest.update.mockImplementation(({ data }) =>
      Promise.resolve(activeQuest({ ...data }))
    );

    const res = await authed(requestApp().patch('/api/quests/quest-1')).send({
      title: 'Same difficulty',
      xpReward: 9999,
    });

    expect(res.status).toBe(200);
    const data = mockPrisma.quest.update.mock.calls[0][0].data;
    expect(data.xpReward).toBeUndefined();
    expect(data.title).toBe('Same difficulty');
  });
});

describe('DELETE /api/quests/:id', () => {
  test('204 deletes an active quest', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(activeQuest());
    mockPrisma.quest.delete.mockResolvedValue(activeQuest());

    const res = await authed(requestApp().delete('/api/quests/quest-1'));

    expect(res.status).toBe(204);
    expect(mockPrisma.quest.delete).toHaveBeenCalledWith({ where: { id: 'quest-1' } });
  });

  test('404 on missing or foreign quest', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(null);

    const res = await authed(requestApp().delete('/api/quests/nope'));

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('QUEST_NOT_FOUND');
    expect(mockPrisma.quest.delete).not.toHaveBeenCalled();
  });

  test('409 QUEST_LOCKED - completed quests are permanent history', async () => {
    mockPrisma.quest.findFirst.mockResolvedValue(activeQuest({ status: 'COMPLETED' }));

    const res = await authed(requestApp().delete('/api/quests/quest-1'));

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('QUEST_LOCKED');
    expect(mockPrisma.quest.delete).not.toHaveBeenCalled();
  });
});
