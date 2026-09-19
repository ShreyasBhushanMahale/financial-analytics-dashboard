import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import { loginBodySchema } from '../schemas/auth.schema.js';
import { login } from '../services/auth.service.js';

export const postLogin: RequestHandler = async (req, res) => {
  const { email, password } = loginBodySchema.parse(req.body);
  const { token, expiresAt, user } = await login(email, password);
  res.json({ token, expiresAt: expiresAt.toISOString(), user });
};

export const getMe: RequestHandler = (req, res) => {
  // Only reachable without a user if the route were mounted without requireAuth.
  if (!req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  res.json({ user: req.user });
};
