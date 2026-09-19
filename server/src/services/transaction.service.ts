import { CATEGORIES, STATUSES, type Category, type Status } from '../constants/transaction.js';
import { TransactionModel, type Transaction } from '../models/transaction.model.js';
import { buildTransactionQuery } from '../queries/buildTransactionQuery.js';
import { buildTransactionSort } from '../queries/buildTransactionSort.js';
import type { ListTransactionsQuery } from '../schemas/transactionFilters.schema.js';

/** A transaction as the API returns it: no Mongo `_id`, and the date as an ISO string. */
export interface TransactionDto {
  id: number;
  date: string;
  amount: number;
  category: Category;
  status: Status;
  user_id: string;
  user_profile: string;
}

export interface TransactionPage {
  data: TransactionDto[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface FilterOptions {
  categories: Category[];
  statuses: Status[];
  userIds: string[];
  /** null only when there are no transactions at all. */
  dateRange: { min: string; max: string } | null;
  amountRange: { min: number; max: number } | null;
}

// Named fields, not a spread: internal fields (like _id) never reach the client.
export function toTransactionDto(transaction: Transaction): TransactionDto {
  return {
    id: transaction.id,
    date: transaction.date.toISOString(),
    amount: transaction.amount,
    category: transaction.category,
    status: transaction.status,
    user_id: transaction.user_id,
    user_profile: transaction.user_profile,
  };
}

export async function listTransactions(query: ListTransactionsQuery): Promise<TransactionPage> {
  const { page, pageSize, sortBy, sortOrder, ...filters } = query;
  const mongoQuery = buildTransactionQuery(filters);

  // The page and the total are independent reads, so they run concurrently.
  const [rows, total] = await Promise.all([
    TransactionModel.find(mongoQuery)
      .sort(buildTransactionSort(sortBy, sortOrder))
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    TransactionModel.countDocuments(mongoQuery),
  ]);

  return {
    data: rows.map(toTransactionDto),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

interface Bounds {
  minDate: Date;
  maxDate: Date;
  minAmount: number;
  maxAmount: number;
  userIds: string[];
}

/** Everything the filter UI needs to offer valid choices, in one aggregation. */
export async function getFilterOptions(): Promise<FilterOptions> {
  const [bounds] = await TransactionModel.aggregate<Bounds>([
    {
      $group: {
        _id: null,
        minDate: { $min: '$date' },
        maxDate: { $max: '$date' },
        minAmount: { $min: '$amount' },
        maxAmount: { $max: '$amount' },
        userIds: { $addToSet: '$user_id' },
      },
    },
  ]);

  return {
    // Categories and statuses come from the schema: every valid value is offered, even if no
    // transaction currently uses it.
    categories: [...CATEGORIES],
    statuses: [...STATUSES],
    userIds: bounds ? [...bounds.userIds].sort((a, b) => a.localeCompare(b)) : [],
    dateRange: bounds
      ? { min: bounds.minDate.toISOString(), max: bounds.maxDate.toISOString() }
      : null,
    amountRange: bounds ? { min: bounds.minAmount, max: bounds.maxAmount } : null,
  };
}
