import { z } from 'zod';
import { CATEGORIES, SORTABLE_FIELDS, SORT_ORDERS, STATUSES } from '../constants/transaction.js';

// These schemas accept both a parsed query string (every value a string, lists comma-separated)
// and a JSON body (real numbers and arrays), so the list, analytics and export endpoints all
// validate filters with the same rules.

/** An empty query value (`?search=`) means "not set", not "the empty string". */
function emptyAsUnset<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === '' ? undefined : value), schema);
}

function optional<T extends z.ZodType>(schema: T) {
  return emptyAsUnset(schema.optional());
}

/** `Paid,Pending` in a query string, `["Paid", "Pending"]` in a body. */
function list<T extends z.ZodType>(item: T) {
  return optional(
    z.preprocess(
      (value) =>
        typeof value === 'string'
          ? value
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean)
          : value,
      z.array(item).max(50),
    ),
  );
}

const filterFields = {
  search: optional(z.string().trim().max(100)),
  dateFrom: optional(z.iso.date()),
  dateTo: optional(z.iso.date()),
  amountMin: optional(z.coerce.number().nonnegative()),
  amountMax: optional(z.coerce.number().nonnegative()),
  categories: list(z.enum(CATEGORIES)),
  statuses: list(z.enum(STATUSES)),
  userIds: list(z.string().trim().min(1).max(50)),
};

interface RangeFields {
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  amountMin?: number | undefined;
  amountMax?: number | undefined;
}

function checkRanges(value: RangeFields, ctx: z.core.$RefinementCtx): void {
  // YYYY-MM-DD strings compare correctly as plain strings.
  if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
    ctx.addIssue({ code: 'custom', path: ['dateTo'], message: 'must be on or after dateFrom' });
  }
  if (
    value.amountMin !== undefined &&
    value.amountMax !== undefined &&
    value.amountMin > value.amountMax
  ) {
    ctx.addIssue({ code: 'custom', path: ['amountMax'], message: 'must be at least amountMin' });
  }
}

// Strict: a misspelled parameter (`statuss=Paid`) is a 400, not a silently unfiltered result.
export const transactionFiltersSchema = z.strictObject(filterFields).superRefine(checkRanges);
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const listTransactionsQuerySchema = z
  .strictObject({
    ...filterFields,
    page: emptyAsUnset(z.coerce.number().int().min(1).default(1)),
    pageSize: emptyAsUnset(z.coerce.number().int().min(1).max(100).default(10)),
    sortBy: emptyAsUnset(z.enum(SORTABLE_FIELDS).default('date')),
    sortOrder: emptyAsUnset(z.enum(SORT_ORDERS).default('desc')),
  })
  .superRefine(checkRanges);
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
