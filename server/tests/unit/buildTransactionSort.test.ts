import { describe, expect, it } from 'vitest';
import { buildTransactionSort } from '../../src/queries/buildTransactionSort.js';

describe('buildTransactionSort', () => {
  it('adds id as a tiebreaker in the same direction', () => {
    expect(buildTransactionSort('date', 'desc')).toEqual({ date: -1, id: -1 });
    expect(buildTransactionSort('amount', 'asc')).toEqual({ amount: 1, id: 1 });
  });

  it('puts the requested field before the tiebreaker', () => {
    expect(Object.keys(buildTransactionSort('status', 'asc'))).toEqual(['status', 'id']);
  });

  it('sorts by id alone when id is the requested field', () => {
    expect(buildTransactionSort('id', 'asc')).toEqual({ id: 1 });
  });
});
