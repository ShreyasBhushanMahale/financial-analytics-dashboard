import { TransactionModel } from '../models/transaction.model.js';
import { buildMonthlyTrendPipeline, buildSummaryPipeline } from '../queries/analyticsPipelines.js';
import type { TransactionFilters } from '../schemas/transactionFilters.schema.js';
import {
  toMonthlyTrend,
  toSummary,
  type MonthBucket,
  type Summary,
  type SummaryBucket,
  type TrendPoint,
} from './analytics.transform.js';

export async function getSummary(filters: TransactionFilters): Promise<Summary> {
  const buckets = await TransactionModel.aggregate<SummaryBucket>(buildSummaryPipeline(filters));
  return toSummary(buckets);
}

export async function getMonthlyTrend(filters: TransactionFilters): Promise<TrendPoint[]> {
  const buckets = await TransactionModel.aggregate<MonthBucket>(buildMonthlyTrendPipeline(filters));
  return toMonthlyTrend(buckets, filters);
}
