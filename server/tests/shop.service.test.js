const { AppError } = require('../src/middleware/errorHandler');
const {
  SHOP_CATALOG,
  seedShop,
  listShop,
  purchaseItem,
  getInventory,
  setEquipped,
} = require('../src/services/shop.service');

const item = { id: 'item-1', name: 'First Flame Badge', description: 'Proof.', cost: 50, type: 'badge' };

function txDouble(overrides = {}) {
  return {
    user: { updateMany: jest.fn(), findUnique: jest.fn() },
    inventoryItem: { create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    activityLog: undefined,
    ...overrides,
  };
}

describe('seedShop (idempotent catalog fill)', () => {
  test('creates only missing entries, reports counts', async () => {
    const db = {
      shopItem: {
        findFirst: jest.fn(({ where }) =>
          Promise.resolve(where.name === SHOP_CATALOG[0].name ? { id: 'x' } : null)
        ),
        create: jest.fn(({ data }) => Promise.resolve({ id: `new-${data.name}`, ...data })),
      },
    };

    const result = await seedShop(db);

    expect(result).toEqual({ created: SHOP_CATALOG.length - 1, total: SHOP_CATALOG.length });
    expect(db.shopItem.create).toHaveBeenCalledTimes(SHOP_CATALOG.length - 1);
  });

  test('catalog holds ten items across the four types', () => {
    expect(SHOP_CATALOG).toHaveLength(10);
    expect(new Set(SHOP_CATALOG.map((i) => i.type))).toEqual(new Set(['theme', 'badge', 'title', 'avatar']));
  });
});

describe('purchaseItem (conditional decrement in a transaction)', () => {
  function dbDouble({ gold = 200, chargeCount = 1, createError = null } = {}) {
    const tx = txDouble();
    tx.user.updateMany.mockResolvedValue({ count: chargeCount });
    tx.user.findUnique.mockResolvedValue({ id: 'user-1', gold: gold - item.cost });
    if (createError) tx.inventoryItem.create.mockRejectedValue(createError);
    else tx.inventoryItem.create.mockResolvedValue({ id: 'inv-1', userId: 'user-1', itemId: item.id });
    return {
      shopItem: { findUnique: jest.fn().mockResolvedValue(item) },
      inventoryItem: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((cb) => cb(tx)),
      __tx: tx,
    };
  }

  test('charges exact price, creates the row, returns the new balance', async () => {
    const db = dbDouble();

    const result = await purchaseItem('user-1', 'item-1', db);

    expect(db.__tx.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', gold: { gte: 50 } },
      data: { gold: { decrement: 50 } },
    });
    expect(result).toMatchObject({ item, gold: 150 });
    expect(result.inventoryItem).toMatchObject({ userId: 'user-1', itemId: 'item-1' });
  });

  test('404 on unknown item, 409 on already owned - before any write', async () => {
    const missing = dbDouble();
    missing.shopItem.findUnique.mockResolvedValue(null);
    await expect(purchaseItem('user-1', 'nope', missing)).rejects.toMatchObject({ code: 'ITEM_NOT_FOUND' });
    expect(missing.$transaction).not.toHaveBeenCalled();

    const owned = dbDouble();
    owned.inventoryItem.findFirst.mockResolvedValue({ id: 'inv-0' });
    await expect(purchaseItem('user-1', 'item-1', owned)).rejects.toMatchObject({ code: 'ALREADY_OWNED' });
    expect(owned.$transaction).not.toHaveBeenCalled();
  });

  test('402 when the conditional charge matches nothing (broke hero)', async () => {
    const db = dbDouble({ gold: 10, chargeCount: 0 });

    await expect(purchaseItem('user-1', 'item-1', db)).rejects.toMatchObject({
      code: 'INSUFFICIENT_GOLD',
      status: 402,
    });
    expect(db.__tx.inventoryItem.create).not.toHaveBeenCalled();
  });

  test('P2002 race on create surfaces as 409 ALREADY_OWNED', async () => {
    const db = dbDouble({ createError: { code: 'P2002' } });

    await expect(purchaseItem('user-1', 'item-1', db)).rejects.toBeInstanceOf(AppError);
    await expect(purchaseItem('user-1', 'item-1', db)).rejects.toMatchObject({ code: 'ALREADY_OWNED' });
  });
});

describe('listShop merges ownership flags', () => {
  test('owned/equipped computed per user', async () => {
    const db = {
      shopItem: { findMany: jest.fn().mockResolvedValue([item, { ...item, id: 'item-2', cost: 300 }]) },
      inventoryItem: { findMany: jest.fn().mockResolvedValue([{ itemId: 'item-1', equipped: true }]) },
    };

    const items = await listShop('user-1', db);

    expect(items[0]).toMatchObject({ id: 'item-1', owned: true, equipped: true });
    expect(items[1]).toMatchObject({ id: 'item-2', owned: false, equipped: false });
  });
});

describe('setEquipped keeps one active item per type', () => {
  function dbDouble() {
    return {
      inventoryItem: {
        findFirst: jest.fn().mockResolvedValue({ id: 'inv-2', userId: 'user-1', itemId: 'item-2' }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'inv-1', itemId: 'item-1' },
          { id: 'inv-2', itemId: 'item-2' },
          { id: 'inv-3', itemId: 'item-3' },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(({ data }) => Promise.resolve({ id: 'inv-2', equipped: data.equipped })),
      },
      shopItem: {
        findUnique: jest.fn().mockResolvedValue({ ...item, id: 'item-2' }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'item-1', type: 'badge' },
          { id: 'item-2', type: 'badge' },
          { id: 'item-3', type: 'theme' },
        ]),
      },
    };
  }

  test('equipping unequips same-type siblings only', async () => {
    const db = dbDouble();

    const result = await setEquipped('user-1', 'inv-2', true, db);

    expect(db.inventoryItem.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['inv-1'] } },
      data: { equipped: false },
    });
    expect(result.inventoryItem).toMatchObject({ id: 'inv-2', equipped: true });
  });

  test('unequipping touches nothing else', async () => {
    const db = dbDouble();

    await setEquipped('user-1', 'inv-2', false, db);

    expect(db.inventoryItem.updateMany).not.toHaveBeenCalled();
    expect(db.inventoryItem.update).toHaveBeenCalledWith({ where: { id: 'inv-2' }, data: { equipped: false } });
  });

  test('404 on foreign inventory rows', async () => {
    const db = dbDouble();
    db.inventoryItem.findFirst.mockResolvedValue(null);

    await expect(setEquipped('user-1', 'nope', true, db)).rejects.toMatchObject({
      code: 'INVENTORY_NOT_FOUND',
    });
  });
});

describe('getInventory enriches rows with item details', () => {
  test('empty collection returns []', async () => {
    const db = {
      inventoryItem: { findMany: jest.fn().mockResolvedValue([]) },
      shopItem: { findMany: jest.fn() },
    };

    await expect(getInventory('user-1', db)).resolves.toEqual([]);
    expect(db.shopItem.findMany).not.toHaveBeenCalled();
  });
});
