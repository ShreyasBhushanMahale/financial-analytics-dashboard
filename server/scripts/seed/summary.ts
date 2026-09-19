import type { Category } from '../../src/constants/transaction.js';
import { TransactionModel } from '../../src/models/transaction.model.js';
import { round2 } from '../../src/utils/money.js';
import { formatAmount } from './format.js';

export interface SeedSummary {
  count: number;
  firstDate: Date | null;
  lastDate: Date | null;
  revenue: number;
  expense: number;
  pendingTotal: number;
  pendingCount: number;
}

// Checked by hand against server/data/transactions.json. A mismatch means the collection holds
// rows the file doesn't (fixed by --reset), or the file itself has changed.
export const EXPECTED_SUMMARY = {
  count: 300,
  revenue: 339_803.25,
  expense: 206_605.0,
  pendingTotal: 205_303.0,
  pendingCount: 114,
} as const;

interface FacetResult {
  overall: { count: number; firstDate: Date; lastDate: Date }[];
  byCategory: { _id: Category; total: number }[];
  pending: { total: number; count: number }[];
}

/** Totals for the whole collection, computed by MongoDB in one round trip. */
export async function summarizeTransactions(): Promise<SeedSummary> {
  const [result] = await TransactionModel.aggregate<FacetResult>([
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              firstDate: { $min: '$date' },
              lastDate: { $max: '$date' },
            },
          },
        ],
        byCategory: [{ $group: { _id: '$category', total: { $sum: '$amount' } } }],
        pending: [
          { $match: { status: 'Pending' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ],
      },
    },
  ]);
  if (!result) throw new Error('$facet returned no document');

  const categoryTotal = (category: Category): number =>
    round2(result.byCategory.find((entry) => entry._id === category)?.total ?? 0);
  const [overall] = result.overall;
  const [pending] = result.pending;

  return {
    count: overall?.count ?? 0,
    firstDate: overall?.firstDate ?? null,
    lastDate: overall?.lastDate ?? null,
    revenue: categoryTotal('Revenue'),
    expense: categoryTotal('Expense'),
    pendingTotal: round2(pending?.total ?? 0),
    pendingCount: pending?.count ?? 0,
  };
}

/** Lists every figure that differs from EXPECTED_SUMMARY; empty means the data is exactly the file. */
export function findMismatches(summary: SeedSummary): string[] {
  const checks = [
    { label: 'Rows', actual: summary.count, expected: EXPECTED_SUMMARY.count, isAmount: false },
    {
      label: 'Revenue',
      actual: summary.revenue,
      expected: EXPECTED_SUMMARY.revenue,
      isAmount: true,
    },
    {
      label: 'Expense',
      actual: summary.expense,
      expected: EXPECTED_SUMMARY.expense,
      isAmount: true,
    },
    {
      label: 'Pending total',
      actual: summary.pendingTotal,
      expected: EXPECTED_SUMMARY.pendingTotal,
      isAmount: true,
    },
    {
      label: 'Pending rows',
      actual: summary.pendingCount,
      expected: EXPECTED_SUMMARY.pendingCount,
      isAmount: false,
    },
  ];

  // Compared in whole cents so float noise can't cause a false mismatch.
  const toCents = (value: number): number => Math.round(value * 100);
  const show = (value: number, isAmount: boolean): string =>
    isAmount ? formatAmount(value) : String(value);

  return checks
    .filter(({ actual, expected }) => toCents(actual) !== toCents(expected))
    .map(
      ({ label, actual, expected, isAmount }) =>
        `${label}: expected ${show(expected, isAmount)}, got ${show(actual, isAmount)}`,
    );
}
