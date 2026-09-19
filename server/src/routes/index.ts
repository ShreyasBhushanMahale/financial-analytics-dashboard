import { Router } from 'express';
import { createAuthRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { transactionsRouter } from './transactions.routes.js';

/** Built per app, so per-instance state such as rate-limit counters isn't shared between apps. */
export function createApiRouter(): Router {
  const router = Router();
  router.use('/health', healthRouter);
  router.use('/auth', createAuthRouter());
  router.use('/transactions', transactionsRouter);
  return router;
}
