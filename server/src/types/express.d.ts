import type { AuthUser } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth on every route mounted behind it. */
      user?: AuthUser;
    }
  }
}

export {};
