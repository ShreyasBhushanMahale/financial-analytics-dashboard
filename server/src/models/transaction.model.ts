import { Schema, model } from 'mongoose';
import { CATEGORIES, STATUSES, type Category, type Status } from '../constants/transaction.js';

export interface Transaction {
  /** The id from the source data, kept separate from Mongo's _id. */
  id: number;
  date: Date;
  /** Always positive; `category` decides whether it adds to revenue or expenses. */
  amount: number;
  category: Category;
  status: Status;
  user_id: string;
  user_profile: string;
}

const transactionSchema = new Schema<Transaction>(
  {
    id: { type: Number, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, enum: CATEGORIES, required: true },
    status: { type: String, enum: STATUSES, required: true },
    user_id: { type: String, required: true },
    user_profile: { type: String, required: true },
  },
  { versionKey: false },
);

// Seed upserts by id; a numeric search term matches id exactly.
transactionSchema.index({ id: 1 }, { unique: true });
// Default list sort (newest first, id breaks ties), "Latest 5 overall", date-range filters.
transactionSchema.index({ date: -1, id: -1 });
// User filter with the default date sort.
transactionSchema.index({ user_id: 1, date: -1 });
// Status filter with the default date sort; the Pending total.
transactionSchema.index({ status: 1, date: -1 });
// Category filter with the default date sort; revenue/expense totals and trend.
transactionSchema.index({ category: 1, date: -1 });
// Amount range filter and amount sort.
transactionSchema.index({ amount: 1, id: 1 });

export const TransactionModel = model<Transaction>('Transaction', transactionSchema);
