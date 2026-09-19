import { Transform, type Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { TransactionModel, type Transaction } from '../models/transaction.model.js';
import { buildTransactionQuery } from '../queries/buildTransactionQuery.js';
import { buildTransactionSort } from '../queries/buildTransactionSort.js';
import type { ExportRequest } from '../schemas/export.schema.js';
import type { TransactionFilters } from '../schemas/transactionFilters.schema.js';
import { createCsvStringifier, toCsvRecord } from './csvFormat.js';

/**
 * Streams every matching transaction as CSV into `destination`. Rows go from a database cursor
 * straight to the output, so memory use stays flat however many rows match.
 */
export async function writeTransactionsCsv(
  request: ExportRequest,
  destination: Writable,
): Promise<void> {
  const cursor = TransactionModel.find(buildTransactionQuery(request.filters))
    .sort(buildTransactionSort(request.sort.by, request.sort.order))
    .lean<Transaction[]>()
    .cursor();

  const toRecords = new Transform({
    objectMode: true,
    transform(transaction: Transaction, _encoding, done) {
      done(null, toCsvRecord(transaction, request.columns));
    },
  });

  // If any stage fails, or the client disconnects mid-download, pipeline() destroys every stage,
  // which also closes the database cursor.
  await pipeline(cursor, toRecords, createCsvStringifier(request.columns), destination);
}

/**
 * Names the file after the date range it covers, or after the moment of export when there is
 * no range: transactions_2024-01-01_to_2024-03-31.csv, transactions_2026-09-19_1432.csv.
 */
export function exportFilename(
  filters: Pick<TransactionFilters, 'dateFrom' | 'dateTo'>,
  now: Date = new Date(),
): string {
  const { dateFrom, dateTo } = filters;
  if (dateFrom && dateTo) return `transactions_${dateFrom}_to_${dateTo}.csv`;
  if (dateFrom) return `transactions_from_${dateFrom}.csv`;
  if (dateTo) return `transactions_until_${dateTo}.csv`;

  const [day, time] = now.toISOString().split('T');
  return `transactions_${day}_${time?.slice(0, 5).replace(':', '')}.csv`;
}
