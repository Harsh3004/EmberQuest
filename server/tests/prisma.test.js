// Offline-safe wiring test: importing the client must not open a connection.
// A dummy URL is enough - no query is ever issued here.
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/emberquest?schema=public';

const { prisma } = require('../src/prisma/client');

describe('prisma wiring', () => {
  test('singleton exposes engine interface and plan models', () => {
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
    expect(prisma.user).toBeDefined();
    expect(prisma.attribute).toBeDefined();
    expect(prisma.quest).toBeDefined();
    expect(prisma.activityLog).toBeDefined();
    expect(prisma.shopItem).toBeDefined();
    expect(prisma.inventoryItem).toBeDefined();
    expect(prisma.refreshToken).toBeDefined();
  });

  afterAll(async () => {
    await prisma.$disconnect().catch(() => {});
  });
});
