const request = require('supertest');
const { createApp } = require('../src/app');

describe('backend base', () => {
  test('GET /api/health returns ok shape', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('emberquest-server');
    expect(typeof res.body.timestamp).toBe('string');
  });

  test('unknown /api route returns consistent 404 shape', async () => {
    const res = await request(createApp()).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Not found', code: 'NOT_FOUND' } });
  });
});
