process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-chars-xxxx';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-chars-xxx';

const mockShopService = {
  listShop: jest.fn(),
  purchaseItem: jest.fn(),
  getInventory: jest.fn(),
  setEquipped: jest.fn(),
};

jest.mock('../src/services/shop.service', () => mockShopService);

const { AppError } = require('../src/middleware/errorHandler');
const { createApp } = require('../src/app');
const { signAccessToken } = require('../src/services/auth.service');

const USER = 'user-1';

beforeEach(() => {
  jest.clearAllMocks();
});

function requestApp() {
  // eslint-disable-next-line global-require
  const request = require('supertest');
  return request(createApp());
}

function authed(req) {
  return req.set('Authorization', `Bearer ${signAccessToken(USER)}`);
}

describe('shop routes guard + error mapping', () => {
  test('401 without token on all four endpoints', async () => {
    const app = requestApp();
    await expect(app.get('/api/shop')).resolves.toMatchObject({ status: 401 });
    await expect(app.post('/api/shop/x/purchase')).resolves.toMatchObject({ status: 401 });
    await expect(app.get('/api/inventory')).resolves.toMatchObject({ status: 401 });
    await expect(app.patch('/api/inventory/x/equip').send({ equipped: true })).resolves.toMatchObject({
      status: 401,
    });
  });

  test('GET /api/shop returns the merged catalog', async () => {
    mockShopService.listShop.mockResolvedValue([{ id: 'i1', owned: false, equipped: false }]);

    const res = await authed(requestApp().get('/api/shop'));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(mockShopService.listShop).toHaveBeenCalledWith(USER);
  });

  test('POST purchase maps 402 INSUFFICIENT_GOLD through the error shape', async () => {
    mockShopService.purchaseItem.mockRejectedValue(new AppError(402, 'Not enough gold', 'INSUFFICIENT_GOLD'));

    const res = await authed(requestApp().post('/api/shop/item-9/purchase'));

    expect(res.status).toBe(402);
    expect(res.body).toEqual({ error: { message: 'Not enough gold', code: 'INSUFFICIENT_GOLD' } });
    expect(mockShopService.purchaseItem).toHaveBeenCalledWith(USER, 'item-9');
  });

  test('POST purchase success returns item, row and balance', async () => {
    mockShopService.purchaseItem.mockResolvedValue({
      item: { id: 'item-1', cost: 50 },
      inventoryItem: { id: 'inv-1' },
      gold: 150,
    });

    const res = await authed(requestApp().post('/api/shop/item-1/purchase'));

    expect(res.status).toBe(200);
    expect(res.body.gold).toBe(150);
  });

  test('PATCH equip validates the body and returns the row', async () => {
    mockShopService.setEquipped.mockResolvedValue({ inventoryItem: { id: 'inv-1', equipped: true } });

    const res = await authed(requestApp().patch('/api/inventory/inv-1/equip')).send({ equipped: true });

    expect(res.status).toBe(200);
    expect(mockShopService.setEquipped).toHaveBeenCalledWith(USER, 'inv-1', true);

    const bad = await authed(requestApp().patch('/api/inventory/inv-1/equip')).send({ equipped: 'yes' });
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');
  });
});
