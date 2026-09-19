import { CATEGORIES, STATUSES, type Category, type Status } from '../constants/transaction.js';
import type { TransactionFilters } from '../schemas/transactionFilters.schema.js';
import { round2 } from '../utils/money.js';
import { startOfUtcDay } from '../utils/utcDay.js';
import { startOfNextUtcMonth, startOfUtcMonth } from '../utils/utcMonth.js';

/** One row from the summary pipeline. */
export interface SummaryBucket {
  _id: { category: Category; status: Status };
  total: number;
  count: number;
}

/** One row from the monthly trend pipeline; `_id` is the first instant of the UTC month. */
export interface MonthBucket {
  _id: Date;
  revenue: number;
  expense: number;
}

export interface Summary {
  totals: {
    revenue: number;
    expense: number;
    /** revenue - expense: the dashboard's Balance card. */
    net: number;
    /** Pending amount across both categories. */
    pending: number;
    pendingCount: number;
    count: number;
  };
  byCategory: { key: Category; total: number; count: number }[];
  byStatus: { key: Status; revenue: number; expense: number; count: number }[];
}

export interface TrendPoint {
  /** ISO timestamp of the first instant of the UTC month. */
  period: string;
  revenue: number;
  expense: number;
}

/**
 * Derives every summary figure from the category x status buckets. Each category and status is
 * always present (with zeros when nothing matches), so the client never has to guess at a
 * missing key.
 */
export function toSummary(buckets: readonly SummaryBucket[]): Summary {
  const matching = (where: { category?: Category; status?: Status }) =>
    buckets.filter(
      ({ _id }) =>
        (where.category === undefined || _id.category === where.category) &&
        (where.status === undefined || _id.status === where.status),
    );
  // Rounded once, after summing, so float noise from MongoDB's sums never reaches the client.
  const total = (where: { category?: Category; status?: Status }) =>
    round2(matching(where).reduce((sum, bucket) => sum + bucket.total, 0));
  const count = (where: { category?: Category; status?: Status }) =>
    matching(where).reduce((sum, bucket) => sum + bucket.count, 0);

  const revenue = total({ category: 'Revenue' });
  const expense = total({ category: 'Expense' });

  return {
    totals: {
      revenue,
      expense,
      net: round2(revenue - expense),
      pending: total({ status: 'Pending' }),
      pendingCount: count({ status: 'Pending' }),
      count: count({}),
    },
    byCategory: CATEGORIES.map((category) => ({
      key: category,
      total: total({ category }),
      count: count({ category }),
    })),
    byStatus: STATUSES.map((status) => ({
      key: status,
      revenue: total({ status, category: 'Revenue' }),
      expense: total({ status, category: 'Expense' }),
      count: count({ status }),
    })),
  };
}

/**
 * One point per month, with months that have no transactions filled in as zero, so the chart's
 * x-axis is continuous. The range runs from dateFrom (or the first month with data) to dateTo
 * (or the last month with data). With no matching transactions at all it's empty, so the client
 * shows its empty state rather than a flat line.
 */
export function toMonthlyTrend(
  buckets: readonly MonthBucket[],
  filters: Pick<TransactionFilters, 'dateFrom' | 'dateTo'>,
): TrendPoint[] {
  if (buckets.length === 0) return [];

  const byMonth = new Map(buckets.map((bucket) => [bucket._id.getTime(), bucket]));
  const bucketTimes = buckets.map((bucket) => bucket._id.getTime());
  const first = filters.dateFrom
    ? startOfUtcMonth(startOfUtcDay(filters.dateFrom))
    : new Date(Math.min(...bucketTimes));
  const last = filters.dateTo
    ? startOfUtcMonth(startOfUtcDay(filters.dateTo))
    : new Date(Math.max(...bucketTimes));

  const points: TrendPoint[] = [];
  for (let month = first; month <= last; month = startOfNextUtcMonth(month)) {
    const bucket = byMonth.get(month.getTime());
    points.push({
      period: month.toISOString(),
      revenue: round2(bucket?.revenue ?? 0),
      expense: round2(bucket?.expense ?? 0),
    });
  }
  return points;
}
