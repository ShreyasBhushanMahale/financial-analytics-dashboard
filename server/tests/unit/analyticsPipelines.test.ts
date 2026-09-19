import { describe, expect, it } from 'vitest';
import {
  buildMonthlyTrendPipeline,
  buildSummaryPipeline,
} from '../../src/queries/analyticsPipelines.js';
import { buildTransactionQuery } from '../../src/queries/buildTransactionQuery.js';
import type { TransactionFilters } from '../../src/schemas/transactionFilters.schema.js';

const filters: TransactionFilters = {
  statuses: ['Pending'],
  dateFrom: '2024-03-01',
  search: 'user_002',
};

describe('buildSummaryPipeline', () => {
  it('filters with the shared query builder, so totals agree with the table', () => {
    expect(buildSummaryPipeline(filters)[0]).toEqual({ $match: buildTransactionQuery(filters) });
  });

  it('sums amount and counts rows per category and status', () => {
    expect(buildSummaryPipeline({})[1]).toEqual({
      $group: {
        _id: { category: '$category', status: '$status' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    });
  });
});

describe('buildMonthlyTrendPipeline', () => {
  it('filters with the shared query builder', () => {
    expect(buildMonthlyTrendPipeline(filters)[0]).toEqual({
      $match: buildTransactionQuery(filters),
    });
  });

  it('groups by UTC calendar month and sorts oldest first', () => {
    const [, group, sort] = buildMonthlyTrendPipeline({});

    expect(group).toMatchObject({
      $group: { _id: { $dateTrunc: { date: '$date', unit: 'month', timezone: 'UTC' } } },
    });
    expect(sort).toEqual({ $sort: { _id: 1 } });
  });
});
