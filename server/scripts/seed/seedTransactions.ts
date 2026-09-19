import { TransactionModel, type Transaction } from '../../src/models/transaction.model.js';

export interface UpsertCounts {
  inserted: number;
  updated: number;
  unchanged: number;
}

/** Upserts by the source `id`, so running it again with the same file changes nothing. */
export async function upsertTransactions(rows: readonly Transaction[]): Promise<UpsertCounts> {
  const result = await TransactionModel.bulkWrite(
    rows.map((row) => ({
      updateOne: { filter: { id: row.id }, update: { $set: row }, upsert: true },
    })),
    // The upserts don't depend on each other, so MongoDB needn't apply them in order.
    { ordered: false },
  );

  const inserted = result.upsertedCount;
  const updated = result.modifiedCount;
  return { inserted, updated, unchanged: rows.length - inserted - updated };
}

export async function deleteAllTransactions(): Promise<number> {
  const { deletedCount } = await TransactionModel.deleteMany({});
  return deletedCount;
}
