import { Router } from 'express';
import { getAnalyticsSummary, getAnalyticsTrend } from '../controllers/analytics.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get('/summary', getAnalyticsSummary);
analyticsRouter.get('/trend', getAnalyticsTrend);
