import { rateLimit, type AugmentedRequest, type RateLimitRequestHandler } from 'express-rate-limit';
import { AppError } from '../errors/AppError.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 10;

/**
 * Created per app rather than at module level: the counters live in memory, and separate app
 * instances (one per test file) must not share them.
 */
export function createLoginRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: MAX_FAILED_ATTEMPTS,
    // Only failures count: guessing is what needs slowing down, and a correct password should
    // never be locked out because of earlier successful logins.
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, _res, next, options) => {
      const resetTime = (req as AugmentedRequest)[options.requestPropertyName]?.resetTime;
      const retryAfterSeconds = resetTime
        ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
        : WINDOW_MS / 1000;
      next(
        new AppError(
          429,
          'RATE_LIMITED',
          'Too many failed login attempts. Please try again later.',
          {
            retryAfterSeconds,
          },
        ),
      );
    },
  });
}
