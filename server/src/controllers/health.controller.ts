import type { RequestHandler } from 'express';
import { isDbConnected } from '../db/connect.js';
import { AppError } from '../errors/AppError.js';

export const getHealth: RequestHandler = (_req, res) => {
  if (!isDbConnected()) {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Database is not connected');
  }
  res.json({ status: 'ok', db: 'connected' });
};
