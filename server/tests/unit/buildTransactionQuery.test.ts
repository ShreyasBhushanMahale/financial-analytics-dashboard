import { describe, expect, it } from 'vitest';
import { buildTransactionQuery } from '../../src/queries/buildTransactionQuery.js';

const utc = (iso: string) => new Date(iso);

/** The regex a search puts on user_id (the first $or condition). */
function userIdPattern(search: string): RegExp {
  const query = buildTransactionQuery({ search });
  return (query.$or?.[0] as { user_id: RegExp }).user_id;
}

describe('buildTransactionQuery', () => {
  it('adds no condition when no filter is set', () => {
    expect(buildTransactionQuery({})).toEqual({});
  });

  describe('date range (UTC days, inclusive)', () => {
    it('starts dateFrom at midnight UTC', () => {
      expect(buildTransactionQuery({ dateFrom: '2024-03-01' })).toEqual({
        date: { $gte: utc('2024-03-01T00:00:00.000Z') },
      });
    });

    it('includes the whole of dateTo by stopping before the next midnight', () => {
      expect(buildTransactionQuery({ dateTo: '2024-03-31' })).toEqual({
        date: { $lt: utc('2024-04-01T00:00:00.000Z') },
      });
    });

    it('combines both bounds into one condition', () => {
      expect(buildTransactionQuery({ dateFrom: '2024-03-01', dateTo: '2024-03-01' })).toEqual({
        date: { $gte: utc('2024-03-01T00:00:00.000Z'), $lt: utc('2024-03-02T00:00:00.000Z') },
      });
    });

    it.each([
      ['a year end', '2024-12-31', '2025-01-01T00:00:00.000Z'],
      ['a leap day', '2024-02-29', '2024-03-01T00:00:00.000Z'],
    ])('rolls dateTo over %s', (_label, dateTo, nextMidnight) => {
      expect(buildTransactionQuery({ dateTo })).toEqual({ date: { $lt: utc(nextMidnight) } });
    });
  });

  describe('amount range', () => {
    it('uses amountMin as an inclusive lower bound', () => {
      expect(buildTransactionQuery({ amountMin: 100 })).toEqual({ amount: { $gte: 100 } });
    });

    it('uses amountMax as an inclusive upper bound', () => {
      expect(buildTransactionQuery({ amountMax: 2000 })).toEqual({ amount: { $lte: 2000 } });
    });

    it('combines both bounds into one condition', () => {
      expect(buildTransactionQuery({ amountMin: 100, amountMax: 2000 })).toEqual({
        amount: { $gte: 100, $lte: 2000 },
      });
    });

    it('keeps 0 as a real bound rather than treating it as "not set"', () => {
      expect(buildTransactionQuery({ amountMin: 0, amountMax: 0 })).toEqual({
        amount: { $gte: 0, $lte: 0 },
      });
    });
  });

  describe('category, status and user lists', () => {
    it('matches any of the listed categories', () => {
      expect(buildTransactionQuery({ categories: ['Revenue', 'Expense'] })).toEqual({
        category: { $in: ['Revenue', 'Expense'] },
      });
    });

    it('matches any of the listed statuses', () => {
      expect(buildTransactionQuery({ statuses: ['Pending'] })).toEqual({
        status: { $in: ['Pending'] },
      });
    });

    it('matches any of the listed users', () => {
      expect(buildTransactionQuery({ userIds: ['user_001', 'user_003'] })).toEqual({
        user_id: { $in: ['user_001', 'user_003'] },
      });
    });

    it('adds no condition for empty lists', () => {
      expect(buildTransactionQuery({ categories: [], statuses: [], userIds: [] })).toEqual({});
    });
  });

  describe('search', () => {
    it('matches user, category and status case-insensitively', () => {
      expect(buildTransactionQuery({ search: 'user_00' })).toEqual({
        $or: [{ user_id: /user_00/i }, { category: /user_00/i }, { status: /user_00/i }],
      });
    });

    it('treats regex characters literally', () => {
      const pattern = userIdPattern('.*');

      expect(pattern.source).toBe('\\.\\*');
      expect(pattern.test('user_001')).toBe(false);
      expect(pattern.test('literally .* here')).toBe(true);
    });

    it('cannot be turned into a pathological pattern', () => {
      const pattern = userIdPattern('(a+)+$');

      expect(pattern.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!')).toBe(false);
      expect(pattern.test('x(a+)+$y')).toBe(true);
    });

    it('also matches an exact id or amount when the term is a number', () => {
      expect(buildTransactionQuery({ search: '1500' })).toEqual({
        $or: [
          { user_id: /1500/i },
          { category: /1500/i },
          { status: /1500/i },
          { id: 1500 },
          { amount: 1500 },
        ],
      });
    });

    it.each(['1,500.50', '$1500.50'])('reads %s as the number 1500.5', (search) => {
      expect(buildTransactionQuery({ search }).$or).toContainEqual({ amount: 1500.5 });
    });

    it.each(['12abc', '1.2.3', '-5'])(
      'does not read the partly numeric %s as a number',
      (search) => {
        expect(buildTransactionQuery({ search }).$or).toHaveLength(3);
      },
    );

    it('trims the term, and ignores a search that is only whitespace', () => {
      expect(buildTransactionQuery({ search: '  Paid  ' }).$or).toContainEqual({ status: /Paid/i });
      expect(buildTransactionQuery({ search: '   ' })).toEqual({});
    });
  });

  it('combines every filter with AND', () => {
    expect(
      buildTransactionQuery({
        search: 'user',
        dateFrom: '2024-01-01',
        dateTo: '2024-06-30',
        amountMin: 150,
        amountMax: 5000,
        categories: ['Expense'],
        statuses: ['Paid'],
        userIds: ['user_002'],
      }),
    ).toEqual({
      date: { $gte: utc('2024-01-01T00:00:00.000Z'), $lt: utc('2024-07-01T00:00:00.000Z') },
      amount: { $gte: 150, $lte: 5000 },
      category: { $in: ['Expense'] },
      status: { $in: ['Paid'] },
      user_id: { $in: ['user_002'] },
      $or: [{ user_id: /user/i }, { category: /user/i }, { status: /user/i }],
    });
  });

  it('does not modify the filters it is given', () => {
    const filters = { categories: ['Revenue' as const], search: 'x' };
    const copy = structuredClone(filters);

    buildTransactionQuery(filters);

    expect(filters).toEqual(copy);
  });
});
