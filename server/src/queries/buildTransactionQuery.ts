import type { QueryFilter } from 'mongoose';
import type { Transaction } from '../models/transaction.model.js';
import type { TransactionFilters } from '../schemas/transactionFilters.schema.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { startOfNextUtcDay, startOfUtcDay } from '../utils/utcDay.js';

// A whole number or a decimal, once "$" and thousands separators are removed: "1,500.50" -> 1500.5.
const NUMERIC_SEARCH = /^\d+(\.\d+)?$/;

/**
 * Turns validated filters into one Mongo query. The list, analytics and export endpoints all call
 * this, so a filter can never mean one thing in the table and another in a chart or a CSV.
 * Pure: no I/O, no hidden defaults. Filters that aren't set add no condition.
 */
export function buildTransactionQuery(filters: TransactionFilters): QueryFilter<Transaction> {
  const query: QueryFilter<Transaction> = {};

  if (filters.dateFrom !== undefined || filters.dateTo !== undefined) {
    query.date = {
      ...(filters.dateFrom !== undefined && { $gte: startOfUtcDay(filters.dateFrom) }),
      // Exclusive bound at the next midnight, so the whole of dateTo is included.
      ...(filters.dateTo !== undefined && { $lt: startOfNextUtcDay(filters.dateTo) }),
    };
  }

  // Compared with undefined, not truthiness: amountMin=0 is a real bound.
  if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
    query.amount = {
      ...(filters.amountMin !== undefined && { $gte: filters.amountMin }),
      ...(filters.amountMax !== undefined && { $lte: filters.amountMax }),
    };
  }

  if (filters.categories?.length) query.category = { $in: filters.categories };
  if (filters.statuses?.length) query.status = { $in: filters.statuses };
  if (filters.userIds?.length) query.user_id = { $in: filters.userIds };

  const search = filters.search?.trim();
  if (search) query.$or = searchConditions(search);

  return query;
}

/**
 * Case-insensitive "contains" on the text fields. A numeric term also matches an exact id or
 * amount, so typing 1500 finds transaction 1500 and every 1,500.00 amount.
 */
function searchConditions(term: string): QueryFilter<Transaction>[] {
  const pattern = new RegExp(escapeRegex(term), 'i');
  const conditions: QueryFilter<Transaction>[] = [
    { user_id: pattern },
    { category: pattern },
    { status: pattern },
  ];

  const numericTerm = term.replace(/[$,]/g, '');
  if (NUMERIC_SEARCH.test(numericTerm)) {
    const value = Number(numericTerm);
    conditions.push({ id: value }, { amount: value });
  }
  return conditions;
}
