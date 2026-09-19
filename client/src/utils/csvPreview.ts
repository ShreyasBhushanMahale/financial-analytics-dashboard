import type { ExportColumnKey, SortField, SortOrder, Transaction } from '../types/api';

/**
 * Formats a cell exactly as the server writes it into the CSV (ISO dates, two-decimal amounts),
 * so the preview shows what the file will contain rather than how the table displays it.
 */
export function formatCsvCell(transaction: Transaction, key: ExportColumnKey): string {
  switch (key) {
    case 'id':
      return String(transaction.id);
    case 'amount':
      return transaction.amount.toFixed(2);
    default:
      return transaction[key];
  }
}

const ORDER_WORDS: Record<SortField, Record<SortOrder, string>> = {
  date: { desc: 'newest first', asc: 'oldest first' },
  amount: { desc: 'largest amount first', asc: 'smallest amount first' },
  id: { desc: 'highest ID first', asc: 'lowest ID first' },
  category: { asc: 'category A–Z', desc: 'category Z–A' },
  status: { asc: 'status A–Z', desc: 'status Z–A' },
  user_id: { asc: 'user A–Z', desc: 'user Z–A' },
};

/** "newest first": how the table's current sort orders the exported rows. */
export function describeSort(sortBy: SortField, sortOrder: SortOrder): string {
  return ORDER_WORDS[sortBy][sortOrder];
}
