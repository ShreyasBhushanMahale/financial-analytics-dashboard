import type { PipelineStage } from 'mongoose';
import type { TransactionFilters } from '../schemas/transactionFilters.schema.js';
import { buildTransactionQuery } from './buildTransactionQuery.js';

// aggregate() doesn't cast values the way find() does. buildTransactionQuery already produces real
// Dates and numbers, so the same $match works unchanged here.

/**
 * At most four buckets (2 categories x 2 statuses). Every figure on the dashboard, including the
 * totals, the category split and the status split, is a sum of these.
 */
export function buildSummaryPipeline(filters: TransactionFilters): PipelineStage[] {
  return [
    { $match: buildTransactionQuery(filters) },
    {
      $group: {
        _id: { category: '$category', status: '$status' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ];
}

/** Revenue and expense per UTC calendar month, oldest first. Needs MongoDB 5.0+ for $dateTrunc. */
export function buildMonthlyTrendPipeline(filters: TransactionFilters): PipelineStage[] {
  return [
    { $match: buildTransactionQuery(filters) },
    {
      $group: {
        _id: { $dateTrunc: { date: '$date', unit: 'month', timezone: 'UTC' } },
        revenue: { $sum: { $cond: [{ $eq: ['$category', 'Revenue'] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$category', 'Expense'] }, '$amount', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ];
}
