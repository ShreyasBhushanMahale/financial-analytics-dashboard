import { stringify, type Stringifier } from 'csv-stringify';
import { EXPORT_COLUMN_LABELS, type ExportColumn } from '../constants/transaction.js';
import type { Transaction } from '../models/transaction.model.js';

// Spreadsheet apps run a cell that starts with one of these as a formula. A crafted value like
// "=HYPERLINK(...)" in an exported file could then run when someone opens it.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

/** Prefixes a leading formula character with an apostrophe, so spreadsheets show it as text. */
export function escapeFormula(value: string): string {
  return FORMULA_TRIGGER.test(value) ? `'${value}` : value;
}

const FORMATTERS: Record<ExportColumn, (transaction: Transaction) => string> = {
  id: (transaction) => String(transaction.id),
  date: (transaction) => transaction.date.toISOString(),
  // Two decimals and no currency symbol, so spreadsheets read the column as numbers.
  amount: (transaction) => transaction.amount.toFixed(2),
  category: (transaction) => escapeFormula(transaction.category),
  status: (transaction) => escapeFormula(transaction.status),
  user_id: (transaction) => escapeFormula(transaction.user_id),
  user_profile: (transaction) => escapeFormula(transaction.user_profile),
};

/** One CSV row: only the requested columns, each formatted as text. */
export function toCsvRecord(
  transaction: Transaction,
  columns: readonly ExportColumn[],
): Partial<Record<ExportColumn, string>> {
  return Object.fromEntries(columns.map((column) => [column, FORMATTERS[column](transaction)]));
}

/**
 * A stream that turns records into CSV text: a header row of labels in the requested order,
 * then one line per record, with quoting handled by csv-stringify.
 */
export function createCsvStringifier(columns: readonly ExportColumn[]): Stringifier {
  return stringify({
    header: true,
    columns: columns.map((key) => ({ key, header: EXPORT_COLUMN_LABELS[key] })),
  });
}
