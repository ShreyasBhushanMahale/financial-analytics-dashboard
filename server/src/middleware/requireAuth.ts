import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { findAuthUser } from '../services/auth.service.js';
import { verifyAccessToken } from '../services/token.service.js';

const BEARER_PATTERN = /^Bearer\s+(\S+)$/i;

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = BEARER_PATTERN.exec(req.headers.authorization ?? '')?.[1];
  if (!token) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');

  // Looking the user up on every request means deleting a user cuts off their access at once,
  // rather than when their token expires. It's one indexed _id read.
  const user = await findAuthUser(verifyAccessToken(token));
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');

  req.user = user;
  next();
};
