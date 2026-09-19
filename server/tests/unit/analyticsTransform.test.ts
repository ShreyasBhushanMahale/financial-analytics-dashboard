import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTransactionRows } from '../../scripts/seed/parseRows.js';
import type { Category, Status } from '../../src/constants/transaction.js';
import {
  toMonthlyTrend,
  toSummary,
  type MonthBucket,
  type SummaryBucket,
} from '../../src/services/analytics.transform.js';

const bucket = (category: Category, status: Status, total: number, count: number) => ({
  _id: { category, status },
  total,
  count,
});
const month = (iso: string, revenue: number, expense: number): MonthBucket => ({
  _id: new Date(iso),
  revenue,
  expense,
});

describe('toSummary', () => {
  it('derives totals, the category split and the status split from the buckets', () => {
    const summary = toSummary([
      bucket('Revenue', 'Paid', 1000, 4),
      bucket('Revenue', 'Pending', 250, 1),
      bucket('Expense', 'Paid', 400, 2),
      bucket('Expense', 'Pending', 100, 3),
    ]);

    expect(summary).toEqual({
      totals: {
        revenue: 1250,
        expense: 500,
        net: 750,
        pending: 350,
        pendingCount: 4,
        count: 10,
      },
      byCategory: [
        { key: 'Revenue', total: 1250, count: 5 },
        { key: 'Expense', total: 500, count: 5 },
      ],
      byStatus: [
        { key: 'Paid', revenue: 1000, expense: 400, count: 6 },
        { key: 'Pending', revenue: 250, expense: 100, count: 4 },
      ],
    });
  });

  it('always lists both categories and both statuses, with zeros when nothing matched', () => {
    const summary = toSummary([bucket('Revenue', 'Paid', 99.5, 1)]);

    expect(summary.byCategory).toEqual([
      { key: 'Revenue', total: 99.5, count: 1 },
      { key: 'Expense', total: 0, count: 0 },
    ]);
    expect(summary.byStatus[1]).toEqual({ key: 'Pending', revenue: 0, expense: 0, count: 0 });
    expect(summary.totals).toMatchObject({ net: 99.5, pending: 0, pendingCount: 0 });
  });

  it('returns all zeros when no transaction matches', () => {
    expect(toSummary([]).totals).toEqual({
      revenue: 0,
      expense: 0,
      net: 0,
      pending: 0,
      pendingCount: 0,
      count: 0,
    });
  });

  it('rounds away floating-point noise to whole cents', () => {
    const summary = toSummary([
      bucket('Revenue', 'Paid', 0.1 + 0.2, 1),
      bucket('Expense', 'Paid', 0.30000000000000004, 1),
    ]);

    expect(summary.totals.revenue).toBe(0.3);
    expect(summary.totals.net).toBe(0);
  });

  it('reproduces the known totals of the real data file', () => {
    const rows = parseTransactionRows(
      JSON.parse(readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8')),
    );
    // Build the buckets the pipeline would return, in plain JavaScript.
    const buckets = new Map<string, SummaryBucket>();
    for (const row of rows) {
      const key = `${row.category}/${row.status}`;
      const current = buckets.get(key) ?? bucket(row.category, row.status, 0, 0);
      buckets.set(key, { ...current, total: current.total + row.amount, count: current.count + 1 });
    }

    expect(toSummary([...buckets.values()]).totals).toEqual({
      revenue: 339_803.25,
      expense: 206_605,
      net: 133_198.25,
      pending: 205_303,
      pendingCount: 114,
      count: 300,
    });
  });
});

describe('toMonthlyTrend', () => {
  it('fills months without transactions with zeros, so the x-axis is continuous', () => {
    const trend = toMonthlyTrend(
      [month('2024-01-01T00:00:00Z', 100, 50), month('2024-04-01T00:00:00Z', 30, 20)],
      {},
    );

    expect(trend).toEqual([
      { period: '2024-01-01T00:00:00.000Z', revenue: 100, expense: 50 },
      { period: '2024-02-01T00:00:00.000Z', revenue: 0, expense: 0 },
      { period: '2024-03-01T00:00:00.000Z', revenue: 0, expense: 0 },
      { period: '2024-04-01T00:00:00.000Z', revenue: 30, expense: 20 },
    ]);
  });

  it('stretches the range to the months of dateFrom and dateTo', () => {
    const trend = toMonthlyTrend([month('2024-03-01T00:00:00Z', 10, 5)], {
      dateFrom: '2024-02-15',
      dateTo: '2024-04-02',
    });

    expect(trend.map((point) => point.period)).toEqual([
      '2024-02-01T00:00:00.000Z',
      '2024-03-01T00:00:00.000Z',
      '2024-04-01T00:00:00.000Z',
    ]);
  });

  it('rolls over a year end', () => {
    const trend = toMonthlyTrend(
      [month('2024-11-01T00:00:00Z', 1, 1), month('2025-02-01T00:00:00Z', 1, 1)],
      {},
    );

    expect(trend.map((point) => point.period.slice(0, 7))).toEqual([
      '2024-11',
      '2024-12',
      '2025-01',
      '2025-02',
    ]);
  });

  it('does not depend on the buckets arriving in order', () => {
    const trend = toMonthlyTrend(
      [month('2024-03-01T00:00:00Z', 3, 0), month('2024-01-01T00:00:00Z', 1, 0)],
      {},
    );

    expect(trend.map((point) => point.revenue)).toEqual([1, 0, 3]);
  });

  it('rounds each month to whole cents', () => {
    // 0.1 + 0.2 is 0.30000000000000004 and 1.1 + 2.2 is 3.3000000000000003 in floating point.
    const [point] = toMonthlyTrend([month('2024-01-01T00:00:00Z', 0.1 + 0.2, 1.1 + 2.2)], {});

    expect(point).toEqual({ period: '2024-01-01T00:00:00.000Z', revenue: 0.3, expense: 3.3 });
  });

  it('is empty when nothing matches, even with a date range, so the client shows its empty state', () => {
    expect(toMonthlyTrend([], { dateFrom: '2024-01-01', dateTo: '2024-12-31' })).toEqual([]);
  });
});
