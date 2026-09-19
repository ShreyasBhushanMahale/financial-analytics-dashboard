import type { RequestHandler } from 'express';
import { transactionFiltersSchema } from '../schemas/transactionFilters.schema.js';
import { getMonthlyTrend, getSummary } from '../services/analytics.service.js';

export const getAnalyticsSummary: RequestHandler = async (req, res) => {
  const filters = transactionFiltersSchema.parse(req.query);
  res.json(await getSummary(filters));
};

export const getAnalyticsTrend: RequestHandler = async (req, res) => {
  const filters = transactionFiltersSchema.parse(req.query);
  res.json({ points: await getMonthlyTrend(filters) });
};
