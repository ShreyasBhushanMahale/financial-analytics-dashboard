import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { disconnectDb } from '../../src/db/connect.js';
import { connectTestDb } from '../setup/db.js';

const app = createApp();

describe('GET /api/health', () => {
  describe('with the database connected', () => {
    beforeAll(connectTestDb);
    afterAll(disconnectDb);

    it('reports ok and the database status', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', db: 'connected' });
    });
  });

  describe('without a database connection', () => {
    it('returns a 503 in the standard error shape', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Database is not connected' },
      });
    });
  });
});
