import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { syncAllIndexes } from '../../scripts/seed/indexes.js';
import { parseTransactionRows } from '../../scripts/seed/parseRows.js';
import { upsertDemoUser } from '../../scripts/seed/seedDemoUser.js';
import { deleteAllTransactions, upsertTransactions } from '../../scripts/seed/seedTransactions.js';
import { findMismatches, summarizeTransactions } from '../../scripts/seed/summary.js';
import { disconnectDb } from '../../src/db/connect.js';
import { TransactionModel } from '../../src/models/transaction.model.js';
import { UserModel } from '../../src/models/user.model.js';
import { verifyPassword } from '../../src/utils/password.js';
import { clearTestDb, connectTestDb } from '../setup/db.js';

const rows = parseTransactionRows(
  JSON.parse(readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8')),
);
const demoUser = { email: 'Analyst@Example.com', password: 'correct-horse', name: 'Demo Analyst' };

// Mongoose types listIndexes() as any[]; this is the part of each index record the tests read.
type IndexInfo = { key: Record<string, 1 | -1> };
const keysOf = (indexes: unknown[]): IndexInfo['key'][] =>
  (indexes as IndexInfo[]).map((index) => index.key);

beforeAll(async () => {
  await connectTestDb();
  await clearTestDb();
});

afterAll(async () => {
  await clearTestDb();
  await disconnectDb();
});

describe('indexes', () => {
  it('creates exactly the planned indexes on both collections', async () => {
    const counts = await syncAllIndexes();

    expect(keysOf(await TransactionModel.listIndexes())).toEqual([
      { _id: 1 },
      { id: 1 },
      { date: -1, id: -1 },
      { user_id: 1, date: -1 },
      { status: 1, date: -1 },
      { category: 1, date: -1 },
      { amount: 1, id: 1 },
    ]);
    expect(keysOf(await UserModel.listIndexes())).toEqual([{ _id: 1 }, { email: 1 }]);
    expect(counts).toEqual({ transactions: 7, users: 2 });
  });
});

describe('upsertTransactions', () => {
  it('inserts every row on the first run and changes nothing on the second', async () => {
    expect(await upsertTransactions(rows)).toEqual({ inserted: 300, updated: 0, unchanged: 0 });
    expect(await upsertTransactions(rows)).toEqual({ inserted: 0, updated: 0, unchanged: 300 });
    expect(await TransactionModel.countDocuments()).toBe(300);
  });

  it('produces exactly the expected totals', async () => {
    const summary = await summarizeTransactions();

    expect(summary).toEqual({
      count: 300,
      firstDate: new Date('2024-01-02T14:17:03Z'),
      lastDate: new Date('2024-12-23T17:05:03Z'),
      revenue: 339_803.25,
      expense: 206_605,
      pendingTotal: 205_303,
      pendingCount: 114,
    });
    expect(findMismatches(summary)).toEqual([]);
  });

  it('reports a mismatch when the collection differs from the file', async () => {
    await TransactionModel.deleteOne({ id: 1 });

    const mismatches = findMismatches(await summarizeTransactions());

    expect(mismatches).toContain('Rows: expected 300, got 299');
    expect(mismatches).toContain('Revenue: expected 339,803.25, got 338,303.25');
    // Put the row back so later tests see the full data set.
    expect(await upsertTransactions(rows)).toMatchObject({ inserted: 1 });
  });
});

describe('upsertDemoUser', () => {
  it('creates the user with a normalised email and a bcrypt hash, never the plain password', async () => {
    expect(await upsertDemoUser(demoUser)).toBe('created');

    const stored = await UserModel.findOne({ email: 'analyst@example.com' }).select(
      '+passwordHash',
    );
    expect(stored?.name).toBe('Demo Analyst');
    expect(stored?.passwordHash).not.toBe(demoUser.password);
    expect(await verifyPassword(demoUser.password, stored?.passwordHash ?? '')).toBe(true);
  });

  it('leaves the user untouched when nothing has changed', async () => {
    const before = await UserModel.findOne().select('+passwordHash').lean();

    expect(await upsertDemoUser(demoUser)).toBe('unchanged');

    const after = await UserModel.findOne().select('+passwordHash').lean();
    expect(after).toEqual(before);
  });

  it('re-hashes when the password changes', async () => {
    expect(await upsertDemoUser({ ...demoUser, password: 'new-password-1' })).toBe('updated');

    const stored = await UserModel.findOne().select('+passwordHash');
    expect(await verifyPassword('new-password-1', stored?.passwordHash ?? '')).toBe(true);
    expect(await UserModel.countDocuments()).toBe(1);
  });

  it('never returns the password hash unless it is asked for', async () => {
    const user = await UserModel.findOne().lean();

    expect(user).not.toHaveProperty('passwordHash');
  });
});

describe('deleteAllTransactions (--reset)', () => {
  it('removes every transaction and keeps users', async () => {
    expect(await deleteAllTransactions()).toBe(300);

    expect(await TransactionModel.countDocuments()).toBe(0);
    expect(await UserModel.countDocuments()).toBe(1);
  });
});
