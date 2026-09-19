import type { SortField, SortOrder } from '../constants/transaction.js';

export type TransactionSort = Partial<Record<SortField, 1 | -1>>;

/**
 * Sorts by the requested field, then by id in the same direction. Many rows share a date, amount
 * or status; without a unique tiebreaker their order can change between requests, and pages
 * would overlap or skip rows.
 */
export function buildTransactionSort(sortBy: SortField, sortOrder: SortOrder): TransactionSort {
  const direction = sortOrder === 'asc' ? 1 : -1;
  return sortBy === 'id' ? { id: direction } : { [sortBy]: direction, id: direction };
}
