import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { disconnectDb } from '../../src/db/connect.js';
import type { Summary, TrendPoint } from '../../src/services/analytics.transform.js';
import type { TransactionPage } from '../../src/services/transaction.service.js';
import { round2 } from '../../src/utils/money.js';
import { clearTestDb, connectTestDb } from '../setup/db.js';
import { SHARED_FILTER_CASES, seedSampleData, toQuery } from '../setup/fixtures.js';

const app = createApp();
let authorization: string;

const get = (path: string, query: Record<string, string> = {}) =>
  request(app).get(path).query(query).set('Authorization', authorization);

beforeAll(async () => {
  await connectTestDb();
  await clearTestDb();
  ({ authorization } = await seedSampleData());
});

afterAll(async () => {
  await clearTestDb();
  await disconnectDb();
});

describe('GET /api/analytics/summary', () => {
  it('reproduces the known totals of the data file', async () => {
    const res = await get('/api/analytics/summary');

    expect(res.status).toBe(200);
    expect((res.body as Summary).totals).toEqual({
      revenue: 339_803.25,
      expense: 206_605,
      net: 133_198.25,
      pending: 205_303,
      pendingCount: 114,
      count: 300,
    });
  });

  it.each(SHARED_FILTER_CASES)(
    'counts the same rows as the list for %s',
    async (_label, filters) => {
      const [summary, list] = await Promise.all([
        get('/api/analytics/summary', toQuery(filters)),
        get('/api/transactions', toQuery(filters)),
      ]);

      expect((summary.body as Summary).totals.count).toBe(
        (list.body as TransactionPage).meta.total,
      );
    },
  );

  it('rejects paging parameters, which only the list accepts', async () => {
    expect((await get('/api/analytics/summary', { page: '2' })).status).toBe(400);
  });

  it('requires a token', async () => {
    expect((await request(app).get('/api/analytics/summary')).status).toBe(401);
  });
});

describe('GET /api/analytics/trend', () => {
  it('returns one point per month of 2024, adding up to the summary totals', async () => {
    const res = await get('/api/analytics/trend');

    expect(res.status).toBe(200);
    const { points } = res.body as { points: TrendPoint[] };
    expect(points.map((point) => point.period.slice(0, 7))).toEqual(
      Array.from({ length: 12 }, (_, month) => `2024-${String(month + 1).padStart(2, '0')}`),
    );
    expect(round2(points.reduce((sum, point) => sum + point.revenue, 0))).toBe(339_803.25);
    expect(round2(points.reduce((sum, point) => sum + point.expense, 0))).toBe(206_605);
  });

  it('covers every requested month, with zeros where there is no data', async () => {
    const res = await get('/api/analytics/trend', { dateFrom: '2024-11-15', dateTo: '2025-02-10' });

    const { points } = res.body as { points: TrendPoint[] };
    expect(points.map((point) => point.period.slice(0, 7))).toEqual([
      '2024-11',
      '2024-12',
      '2025-01',
      '2025-02',
    ]);
    expect(points.slice(2)).toEqual([
      { period: '2025-01-01T00:00:00.000Z', revenue: 0, expense: 0 },
      { period: '2025-02-01T00:00:00.000Z', revenue: 0, expense: 0 },
    ]);
  });
});
