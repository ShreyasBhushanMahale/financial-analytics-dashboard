import { TransactionModel } from '../../src/models/transaction.model.js';
import { UserModel } from '../../src/models/user.model.js';

export interface IndexCounts {
  transactions: number;
  users: number;
}

/** Makes each collection's indexes match its schema exactly (creating missing, dropping stale). */
export async function syncAllIndexes(): Promise<IndexCounts> {
  await Promise.all([TransactionModel.syncIndexes(), UserModel.syncIndexes()]);
  const [transactionIndexes, userIndexes] = await Promise.all([
    TransactionModel.listIndexes(),
    UserModel.listIndexes(),
  ]);
  return { transactions: transactionIndexes.length, users: userIndexes.length };
}
