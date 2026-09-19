import { describe, expect, it } from 'vitest';
import {
  listTransactionsQuerySchema,
  transactionFiltersSchema,
} from '../../src/schemas/transactionFilters.schema.js';

/** The path of every issue, for asserting which field a rejection points at. */
function issuePaths(input: unknown): PropertyKey[][] {
  const result = listTransactionsQuerySchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path);
}

describe('listTransactionsQuerySchema', () => {
  it('defaults to the first 10 rows, newest first', () => {
    expect(listTransactionsQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 10,
      sortBy: 'date',
      sortOrder: 'desc',
    });
  });

  it('turns query-string values into numbers and lists', () => {
    expect(
      listTransactionsQuerySchema.parse({
        page: '2',
        pageSize: '25',
        amountMin: '100.5',
        categories: 'Revenue,Expense',
        statuses: 'Pending',
        userIds: 'user_001, user_002',
        search: '  user_00  ',
      }),
    ).toMatchObject({
      page: 2,
      pageSize: 25,
      amountMin: 100.5,
      categories: ['Revenue', 'Expense'],
      statuses: ['Pending'],
      userIds: ['user_001', 'user_002'],
      search: 'user_00',
    });
  });

  it('accepts a repeated parameter as a list', () => {
    expect(listTransactionsQuerySchema.parse({ statuses: ['Paid', 'Pending'] })).toMatchObject({
      statuses: ['Paid', 'Pending'],
    });
  });

  it('treats empty values as not set', () => {
    expect(
      listTransactionsQuerySchema.parse({ search: '', amountMin: '', categories: '', page: '' }),
    ).toEqual({ page: 1, pageSize: 10, sortBy: 'date', sortOrder: 'desc' });
  });

  it.each([
    ['a category outside the enum', { categories: 'Revenue,Refund' }, ['categories', 1]],
    ['a status outside the enum', { statuses: 'Done' }, ['statuses', 0]],
    ['a sort field outside the whitelist', { sortBy: 'user_profile' }, ['sortBy']],
    ['a sort order other than asc/desc', { sortOrder: 'up' }, ['sortOrder']],
    ['page 0', { page: '0' }, ['page']],
    ['a fractional page', { page: '1.5' }, ['page']],
    ['a page size over 100', { pageSize: '101' }, ['pageSize']],
    ['a negative amount', { amountMin: '-1' }, ['amountMin']],
    ['an amount that is not a number', { amountMax: 'lots' }, ['amountMax']],
    ['an impossible date', { dateFrom: '2024-02-30' }, ['dateFrom']],
    ['a non-ISO date', { dateTo: '03/01/2024' }, ['dateTo']],
    ['a search over 100 characters', { search: 'x'.repeat(101) }, ['search']],
    ['an unknown parameter', { statuss: 'Paid' }, []],
  ])('rejects %s', (_label, input, expectedPath) => {
    expect(issuePaths(input)).toContainEqual(expectedPath);
  });

  it('rejects dateFrom after dateTo, pointing at dateTo', () => {
    expect(issuePaths({ dateFrom: '2024-05-01', dateTo: '2024-04-30' })).toEqual([['dateTo']]);
  });

  it('accepts a single-day range', () => {
    expect(issuePaths({ dateFrom: '2024-05-01', dateTo: '2024-05-01' })).toEqual([]);
  });

  it('rejects amountMin above amountMax, pointing at amountMax', () => {
    expect(issuePaths({ amountMin: '500', amountMax: '100' })).toEqual([['amountMax']]);
  });
});

describe('transactionFiltersSchema', () => {
  it('accepts JSON arrays and numbers, as a request body sends them', () => {
    expect(
      transactionFiltersSchema.parse({
        categories: ['Revenue'],
        amountMin: 100,
        dateTo: '2024-06-30',
      }),
    ).toEqual({ categories: ['Revenue'], amountMin: 100, dateTo: '2024-06-30' });
  });

  it('rejects paging fields, which only belong to the list query', () => {
    expect(transactionFiltersSchema.safeParse({ page: 1 }).success).toBe(false);
  });
});
