import { Router } from 'express';
import { getExportColumns, postExport } from '../controllers/export.controller.js';
import {
  getTransactionFilterOptions,
  getTransactions,
} from '../controllers/transactions.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);
transactionsRouter.get('/', getTransactions);
transactionsRouter.get('/filter-options', getTransactionFilterOptions);
// POST, not GET: the column list and filters travel in a JSON body, and the client downloads the
// response as a blob because a plain link can't carry the Authorization header.
transactionsRouter.post('/export', postExport);
transactionsRouter.get('/export/columns', getExportColumns);
