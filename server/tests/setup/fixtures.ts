import { readFileSync } from 'node:fs';
import type { Express } from 'express';
import request from 'supertest';
import { parseTransactionRows } from '../../scripts/seed/parseRows.js';
import { upsertTransactions } from '../../scripts/seed/seedTransactions.js';
import type { Transaction } from '../../src/models/transaction.model.js';
import { UserModel } from '../../src/models/user.model.js';
import { signAccessToken } from '../../src/services/token.service.js';
import type { TransactionPage } from '../../src/services/transaction.service.js';

/** The raw sample file, exactly as the seed reads it. */
export function readSampleFile(): unknown {
  return JSON.parse(
    readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8'),
  ) as unknown;
}

/** The 300 sample transactions, validated and converted the same way the seed does it. */
export function loadSampleTransactions(): Transaction[] {
  return parseTransactionRows(readSampleFile());
}

/** Seeds the sample transactions and one user; returns the rows and that user's auth header. */
export async function seedSampleData(): Promise<{ rows: Transaction[]; authorization: string }> {
  const rows = loadSampleTransactions();
  await upsertTransactions(rows);
  const user = await UserModel.create({
    email: 'analyst@example.com',
    name: 'Analyst',
    passwordHash: 'not-used-in-these-tests',
  });
  return { rows, authorization: `Bearer ${signAccessToken(user._id.toString()).token}` };
}

type Filters = Record<string, string | number | string[]>;

/**
 * Filter combinations the list, analytics and export endpoints must agree on. They're written as
 * JSON filters (the export body); `toQuery` turns them into query parameters for the GET endpoints.
 */
export const SHARED_FILTER_CASES: [label: string, filters: Filters][] = [
  ['no filters', {}],
  ['pending expenses', { statuses: ['Pending'], categories: ['Expense'] }],
  [
    'one quarter for two users',
    { dateFrom: '2024-04-01', dateTo: '2024-06-30', userIds: ['user_001', 'user_003'] },
  ],
  ['an amount band plus a search', { amountMin: 1000, amountMax: 3000, search: 'user_00' }],
];

/** `{ statuses: ['Paid', 'Pending'] }` -> `{ statuses: 'Paid,Pending' }`, as a query string sends it. */
export function toQuery(filters: Filters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.join(',') : String(value),
    ]),
  );
}

/** Every id the list endpoint returns for a query, across all its pages, in order. */
export async function fetchAllListedIds(
  app: Express,
  authorization: string,
  query: Record<string, string>,
): Promise<number[]> {
  const ids: number[] = [];
  for (let page = 1; ; page++) {
    const res = await request(app)
      .get('/api/transactions')
      .query({ ...query, page: String(page), pageSize: '100' })
      .set('Authorization', authorization);
    const { data, meta } = res.body as TransactionPage;
    ids.push(...data.map((row) => row.id));
    if (page >= meta.totalPages) return ids;
  }
}
