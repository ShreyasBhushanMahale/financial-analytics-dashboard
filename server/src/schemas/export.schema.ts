import { z } from 'zod';
import { EXPORT_COLUMNS, SORTABLE_FIELDS, SORT_ORDERS } from '../constants/transaction.js';
import { transactionFiltersSchema } from './transactionFilters.schema.js';

export const exportBodySchema = z.strictObject({
  // Whitelisted: nothing outside EXPORT_COLUMNS (such as _id) can ever be written to a file.
  columns: z
    .array(z.enum(EXPORT_COLUMNS))
    .min(1, 'choose at least one column')
    .refine((columns) => new Set(columns).size === columns.length, 'columns must not repeat'),
  // The same filters as the table, so the file contains exactly the rows the user was looking at.
  filters: transactionFiltersSchema.default({}),
  sort: z
    .strictObject({
      by: z.enum(SORTABLE_FIELDS).default('date'),
      order: z.enum(SORT_ORDERS).default('desc'),
    })
    .default({ by: 'date', order: 'desc' }),
});

export type ExportRequest = z.infer<typeof exportBodySchema>;
