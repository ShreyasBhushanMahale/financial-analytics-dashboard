import { Router } from 'express';
import { getMe, postLogin } from '../controllers/auth.controller.js';
import { createLoginRateLimiter } from '../middleware/loginRateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';

/*
 * There is deliberately no POST /logout. A JWT stays valid until it expires and the server keeps
 * no session, so the client logs out by discarding its token.
 *
 * Real server-side logout would need a denylist: give every token a unique `jti` claim, store the
 * jti at logout in a collection with a TTL index on the token's `exp` (so entries delete
 * themselves once the token would have expired anyway), and have requireAuth reject any listed
 * jti. That's one extra lookup per request. A per-user `tokenVersion` counter is lighter, but it
 * logs out every device at once. For an 8-hour token in this app, client-side logout is enough.
 */
export function createAuthRouter(): Router {
  const router = Router();
  router.post('/login', createLoginRateLimiter(), postLogin);
  router.get('/me', requireAuth, getMe);
  return router;
}
