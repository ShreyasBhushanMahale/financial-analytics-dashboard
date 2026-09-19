import { describe, expect, it } from 'vitest';
import { exportBodySchema } from '../../src/schemas/export.schema.js';
import { exportFilename } from '../../src/services/export.service.js';

function issuePaths(input: unknown): PropertyKey[][] {
  const result = exportBodySchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path);
}

describe('exportBodySchema', () => {
  it('defaults to every row, newest first, when only columns are given', () => {
    expect(exportBodySchema.parse({ columns: ['id', 'amount'] })).toEqual({
      columns: ['id', 'amount'],
      filters: {},
      sort: { by: 'date', order: 'desc' },
    });
  });

  it('accepts the same filters as the table, as JSON', () => {
    const body = {
      columns: ['date', 'amount'],
      filters: { statuses: ['Pending'], dateFrom: '2024-01-01', amountMin: 100 },
      sort: { by: 'amount', order: 'asc' },
    };

    expect(exportBodySchema.parse(body)).toEqual(body);
  });

  it.each([
    ['no columns', { columns: [] }, ['columns']],
    ['a column outside the whitelist', { columns: ['id', '_id'] }, ['columns', 1]],
    ['a column that is not a transaction field', { columns: ['passwordHash'] }, ['columns', 0]],
    ['a repeated column', { columns: ['id', 'id'] }, ['columns']],
    ['a missing column list', {}, ['columns']],
    [
      'a backwards date range',
      { columns: ['id'], filters: { dateFrom: '2024-05-01', dateTo: '2024-04-01' } },
      ['filters', 'dateTo'],
    ],
    ['a paging field among the filters', { columns: ['id'], filters: { page: 2 } }, ['filters']],
    [
      'a sort field outside the whitelist',
      { columns: ['id'], sort: { by: 'user_profile' } },
      ['sort', 'by'],
    ],
    ['an unknown top-level field', { columns: ['id'], format: 'xlsx' }, []],
  ])('rejects %s', (_label, input, expectedPath) => {
    expect(issuePaths(input)).toContainEqual(expectedPath);
  });
});

describe('exportFilename', () => {
  it('names the file after a full date range', () => {
    expect(exportFilename({ dateFrom: '2024-01-01', dateTo: '2024-03-31' })).toBe(
      'transactions_2024-01-01_to_2024-03-31.csv',
    );
  });

  it('names an open-ended range by its one bound', () => {
    expect(exportFilename({ dateFrom: '2024-07-01' })).toBe('transactions_from_2024-07-01.csv');
    expect(exportFilename({ dateTo: '2024-06-30' })).toBe('transactions_until_2024-06-30.csv');
  });

  it('uses the UTC time of export when there is no date range', () => {
    expect(exportFilename({}, new Date('2026-09-19T14:32:10Z'))).toBe(
      'transactions_2026-09-19_1432.csv',
    );
  });
});
