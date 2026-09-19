import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { disconnectDb } from '../../src/db/connect.js';
import type { ErrorBody } from '../../src/errors/AppError.js';
import { TransactionModel } from '../../src/models/transaction.model.js';
import { clearTestDb, connectTestDb } from '../setup/db.js';
import {
  SHARED_FILTER_CASES,
  fetchAllListedIds,
  seedSampleData,
  toQuery,
} from '../setup/fixtures.js';

const app = createApp();
let authorization: string;

const exportCsv = (body: object) =>
  request(app).post('/api/transactions/export').set('Authorization', authorization).send(body);

/** The CSV as lines, without the trailing newline. */
const linesOf = (csv: string) => csv.trimEnd().split('\n');

beforeAll(async () => {
  await connectTestDb();
  await clearTestDb();
  ({ authorization } = await seedSampleData());
});

afterAll(async () => {
  await clearTestDb();
  await disconnectDb();
});

describe('POST /api/transactions/export', () => {
  it('streams a CSV download with labelled headers in the requested column order', async () => {
    const res = await exportCsv({
      columns: ['status', 'id', 'amount'],
      filters: { dateFrom: '2024-03-01', dateTo: '2024-03-31' },
    });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="transactions_2024-03-01_to_2024-03-31.csv"',
    );
    expect(res.headers['cache-control']).toBe('no-store');
    expect(linesOf(res.text)[0]).toBe('Status,ID,Amount');
  });

  it.each(SHARED_FILTER_CASES)(
    'contains exactly the rows the list returns, in the same order, for %s',
    async (_label, filters) => {
      const sort = { by: 'amount', order: 'desc' } as const;
      const res = await exportCsv({ columns: ['id'], filters, sort });

      const exportedIds = linesOf(res.text).slice(1).map(Number);
      const listedIds = await fetchAllListedIds(app, authorization, {
        ...toQuery(filters),
        sortBy: sort.by,
        sortOrder: sort.order,
      });
      expect(exportedIds).toEqual(listedIds);
      expect(exportedIds.length).toBeGreaterThan(0);
    },
  );

  it('writes dates as ISO 8601 UTC and amounts with two decimals', async () => {
    const res = await exportCsv({
      columns: ['id', 'date', 'amount', 'category', 'status', 'user_id', 'user_profile'],
      sort: { by: 'id', order: 'asc' },
    });

    expect(linesOf(res.text).slice(0, 2)).toEqual([
      'ID,Date (UTC),Amount,Category,Status,User ID,User Profile',
      '1,2024-01-15T08:34:12.000Z,1500.00,Revenue,Paid,user_001,https://thispersondoesnotexist.com/',
    ]);
  });

  it('escapes a value a spreadsheet would otherwise run as a formula', async () => {
    await TransactionModel.create({
      id: 9001,
      date: new Date('2024-06-01T00:00:00Z'),
      amount: 10,
      category: 'Revenue',
      status: 'Paid',
      user_id: '=HYPERLINK("http://example.com")',
      user_profile: 'https://thispersondoesnotexist.com/',
    });
    try {
      const res = await exportCsv({ columns: ['id', 'user_id'], filters: { search: 'HYPERLINK' } });

      expect(linesOf(res.text)).toEqual([
        'ID,User ID',
        `9001,"'=HYPERLINK(""http://example.com"")"`,
      ]);
    } finally {
      await TransactionModel.deleteOne({ id: 9001 });
    }
  });

  it('still writes the header row when nothing matches', async () => {
    const res = await exportCsv({ columns: ['id', 'amount'], filters: { search: 'no-such-user' } });

    expect(res.status).toBe(200);
    expect(res.text).toBe('ID,Amount\n');
  });

  it('answers an invalid request with a JSON error, not a partial file', async () => {
    const res = await exportCsv({ columns: ['id', '_id'] });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
    expect((res.body as ErrorBody).error.details).toEqual([
      expect.objectContaining({ path: 'columns[1]' }),
    ]);
  });

  it('requires a token', async () => {
    const res = await request(app)
      .post('/api/transactions/export')
      .send({ columns: ['id'] });

    expect(res.status).toBe(401);
  });
});
