import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { disconnectDb } from '../../src/db/connect.js';
import type { ErrorBody } from '../../src/errors/AppError.js';
import type { Transaction } from '../../src/models/transaction.model.js';
import type { TransactionPage } from '../../src/services/transaction.service.js';
import { clearTestDb, connectTestDb } from '../setup/db.js';
import { loadSampleTransactions, seedSampleData } from '../setup/fixtures.js';

const app = createApp();
// The same rows the database holds, used as a plain-JavaScript answer key for each filter.
const rows = loadSampleTransactions();
let authorization: string;

const list = (query: Record<string, string> = {}) =>
  request(app).get('/api/transactions').query(query).set('Authorization', authorization);
const pageOf = async (query: Record<string, string>) => (await list(query)).body as TransactionPage;
const utcDay = (row: Transaction) => row.date.toISOString().slice(0, 10);
const contains = (value: string, term: string) => value.toLowerCase().includes(term.toLowerCase());

beforeAll(async () => {
  await connectTestDb();
  await clearTestDb();
  ({ authorization } = await seedSampleData());
});

afterAll(async () => {
  await clearTestDb();
  await disconnectDb();
});

describe('GET /api/transactions', () => {
  it('requires a token', async () => {
    const res = await request(app).get('/api/transactions');

    expect(res.status).toBe(401);
  });

  it('returns the newest 10 transactions by default, in the public shape', async () => {
    const res = await list();

    expect(res.status).toBe(200);
    const page = res.body as TransactionPage;
    expect(page.meta).toEqual({ page: 1, pageSize: 10, total: 300, totalPages: 30 });

    const newestFirst = [...rows]
      .sort((a, b) => b.date.getTime() - a.date.getTime() || b.id - a.id)
      .slice(0, 10);
    expect(page.data.map((row) => row.id)).toEqual(newestFirst.map((row) => row.id));

    const [first] = newestFirst;
    expect(page.data[0]).toStrictEqual({
      id: first?.id,
      date: first?.date.toISOString(),
      amount: first?.amount,
      category: first?.category,
      status: first?.status,
      user_id: first?.user_id,
      user_profile: first?.user_profile,
    });
  });

  it('reports pagination meta', async () => {
    const page = await pageOf({ page: '3', pageSize: '25' });

    expect(page.meta).toEqual({ page: 3, pageSize: 25, total: 300, totalPages: 12 });
    expect(page.data).toHaveLength(25);
  });

  it('never repeats or skips a row across pages, even when sorting a field full of ties', async () => {
    const ids: number[] = [];
    for (let pageNumber = 1; pageNumber <= 6; pageNumber++) {
      const page = await pageOf({ sortBy: 'status', page: String(pageNumber), pageSize: '50' });
      ids.push(...page.data.map((row) => row.id));
    }

    expect(new Set(ids).size).toBe(300);
  });

  it('returns an empty page past the end, with the real totals', async () => {
    const page = await pageOf({ page: '99' });

    expect(page.data).toEqual([]);
    expect(page.meta).toEqual({ page: 99, pageSize: 10, total: 300, totalPages: 30 });
  });

  it('sorts by a whitelisted field in either direction', async () => {
    const ascending = await pageOf({ sortBy: 'amount', sortOrder: 'asc', pageSize: '100' });
    const descending = await pageOf({ sortBy: 'amount', sortOrder: 'desc' });

    const amounts = ascending.data.map((row) => row.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
    expect(amounts[0]).toBe(150);
    expect(descending.data[0]?.amount).toBe(5000);
  });

  it('rejects a sort field outside the whitelist', async () => {
    const res = await list({ sortBy: 'user_profile' });

    expect(res.status).toBe(400);
    const { error } = res.body as ErrorBody;
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual([expect.objectContaining({ path: 'sortBy' })]);
  });

  it('rejects unknown parameters instead of ignoring them', async () => {
    const res = await list({ statuss: 'Pending' });

    expect(res.status).toBe(400);
  });

  // Each case is checked against the same filter written in plain JavaScript over the source file.
  it.each<[string, Record<string, string>, (row: Transaction) => boolean]>([
    ['a status', { statuses: 'Pending' }, (row) => row.status === 'Pending'],
    [
      'a category and two users',
      { categories: 'Expense', userIds: 'user_002,user_003' },
      (row) => row.category === 'Expense' && ['user_002', 'user_003'].includes(row.user_id),
    ],
    [
      'an inclusive UTC date range',
      { dateFrom: '2024-03-01', dateTo: '2024-03-31' },
      (row) => utcDay(row) >= '2024-03-01' && utcDay(row) <= '2024-03-31',
    ],
    [
      'an amount range',
      { amountMin: '1000', amountMax: '2000' },
      (row) => row.amount >= 1000 && row.amount <= 2000,
    ],
    [
      'a case-insensitive text search',
      { search: 'USER_004' },
      (row) => contains(row.user_id, 'USER_004'),
    ],
    [
      'a numeric search, matching id or amount exactly',
      { search: '150' },
      (row) => row.id === 150 || row.amount === 150,
    ],
  ])('filters by %s', async (_label, query, matches) => {
    const page = await pageOf({ ...query, pageSize: '100' });

    expect(page.meta.total).toBe(rows.filter(matches).length);
    expect(page.meta.total).toBeGreaterThan(0);
    const returned = new Map(rows.map((row) => [row.id, row]));
    for (const row of page.data) expect(matches(returned.get(row.id) as Transaction)).toBe(true);
  });

  it('finds the 114 pending transactions from the data facts', async () => {
    expect((await pageOf({ statuses: 'Pending' })).meta.total).toBe(114);
  });

  it('matches regex characters literally instead of as a pattern', async () => {
    expect((await pageOf({ search: '.*' })).meta.total).toBe(0);
  });
});

describe('GET /api/transactions/filter-options', () => {
  it('lists every valid choice and the bounds of the data', async () => {
    const res = await request(app)
      .get('/api/transactions/filter-options')
      .set('Authorization', authorization);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      categories: ['Revenue', 'Expense'],
      statuses: ['Paid', 'Pending'],
      userIds: ['user_001', 'user_002', 'user_003', 'user_004'],
      dateRange: { min: '2024-01-02T14:17:03.000Z', max: '2024-12-23T17:05:03.000Z' },
      amountRange: { min: 150, max: 5000 },
    });
  });

  it('requires a token', async () => {
    const res = await request(app).get('/api/transactions/filter-options');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/transactions/export/columns', () => {
  it('lists exactly the exportable columns with their CSV header labels, in file order', async () => {
    const res = await request(app)
      .get('/api/transactions/export/columns')
      .set('Authorization', authorization);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'date', label: 'Date (UTC)' },
        { key: 'amount', label: 'Amount' },
        { key: 'category', label: 'Category' },
        { key: 'status', label: 'Status' },
        { key: 'user_id', label: 'User ID' },
        { key: 'user_profile', label: 'User Profile' },
      ],
    });
  });

  it('requires a token', async () => {
    const res = await request(app).get('/api/transactions/export/columns');

    expect(res.status).toBe(401);
  });
});
