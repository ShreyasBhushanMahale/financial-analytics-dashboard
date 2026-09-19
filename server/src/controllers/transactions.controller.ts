import type { RequestHandler } from 'express';
import { listTransactionsQuerySchema } from '../schemas/transactionFilters.schema.js';
import { getFilterOptions, listTransactions } from '../services/transaction.service.js';

export const getTransactions: RequestHandler = async (req, res) => {
  const query = listTransactionsQuerySchema.parse(req.query);
  res.json(await listTransactions(query));
};

export const getTransactionFilterOptions: RequestHandler = async (_req, res) => {
  res.json(await getFilterOptions());
};
