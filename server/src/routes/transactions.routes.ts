import { Router } from 'express';
import {
  getTransactionFilterOptions,
  getTransactions,
} from '../controllers/transactions.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);
transactionsRouter.get('/', getTransactions);
transactionsRouter.get('/filter-options', getTransactionFilterOptions);
