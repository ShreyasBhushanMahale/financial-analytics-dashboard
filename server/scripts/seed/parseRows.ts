import { z } from 'zod';
import { CATEGORIES, STATUSES } from '../../src/constants/transaction.js';
import type { Transaction } from '../../src/models/transaction.model.js';
import { describeIssues } from '../../src/utils/zodIssues.js';

const MAX_REPORTED_ISSUES = 10;

const rowSchema = z.object({
  id: z.number().int().positive(),
  date: z.iso.datetime().transform((value) => new Date(value)),
  amount: z.number().nonnegative(),
  category: z.enum(CATEGORIES),
  status: z.enum(STATUSES),
  user_id: z.string().min(1),
  user_profile: z.url(),
});

const rowsSchema = z.array(rowSchema).superRefine((rows, ctx) => {
  // Upserting by id would silently merge duplicates, so they're rejected up front.
  const seen = new Set<number>();
  rows.forEach((row, index) => {
    if (seen.has(row.id)) {
      ctx.addIssue({ code: 'custom', path: [index, 'id'], message: `duplicate id ${row.id}` });
    }
    seen.add(row.id);
  });
});

/** Validates the raw JSON and converts it to Transaction documents. Throws listing the bad rows. */
export function parseTransactionRows(input: unknown): Transaction[] {
  const result = rowsSchema.safeParse(input);
  if (result.success) return result.data;

  const issues = describeIssues(result.error);
  const lines = issues
    .slice(0, MAX_REPORTED_ISSUES)
    .map(({ path, message }) => `  - rows${path}: ${message}`);
  if (issues.length > MAX_REPORTED_ISSUES) {
    lines.push(`  ...and ${issues.length - MAX_REPORTED_ISSUES} more`);
  }
  throw new Error(`transactions.json is invalid:\n${lines.join('\n')}`);
}
