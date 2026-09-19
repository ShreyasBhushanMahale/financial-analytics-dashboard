import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AppError } from '../errors/AppError.js';
import { durationToSeconds } from '../utils/duration.js';

const ALGORITHM = 'HS256';
const TOKEN_TTL_SECONDS = durationToSeconds(env.JWT_EXPIRES_IN);

// `sub` is the only claim the app trusts. It must look like a Mongo ObjectId, or the user lookup
// would throw a CastError (a 500) instead of a clean 401.
const claimsSchema = z.object({ sub: z.string().regex(/^[a-f\d]{24}$/i) });

export interface SignedToken {
  token: string;
  expiresAt: Date;
}

export function signAccessToken(userId: string, now: Date = new Date()): SignedToken {
  const issuedAt = Math.floor(now.getTime() / 1000);
  // jsonwebtoken computes exp from an explicit iat, so expiresAt is exact and tests can sign in the past.
  const token = jwt.sign({ sub: userId, iat: issuedAt }, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: TOKEN_TTL_SECONDS,
  });
  return { token, expiresAt: new Date((issuedAt + TOKEN_TTL_SECONDS) * 1000) };
}

/** Returns the user id the token was issued to, or throws a 401 AppError. */
export function verifyAccessToken(token: string): string {
  let payload: unknown;
  try {
    // Pinning the algorithm rejects `alg: none` tokens and algorithm-swap tricks.
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please log in again.');
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
  }

  const claims = claimsSchema.safeParse(payload);
  if (!claims.success) throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
  return claims.data.sub;
}
