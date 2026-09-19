import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { disconnectDb } from '../../src/db/connect.js';
import type { ErrorBody } from '../../src/errors/AppError.js';
import { UserModel } from '../../src/models/user.model.js';
import { signAccessToken } from '../../src/services/token.service.js';
import { hashPassword, verifyPassword } from '../../src/utils/password.js';
import { clearTestDb, connectTestDb } from '../setup/db.js';

// Every export becomes a spy that still calls the real function, so a test can check that a
// bcrypt compare happened without changing what it returns.
vi.mock('../../src/utils/password.js', { spy: true });

interface LoginResponse {
  token: string;
  expiresAt: string;
  user: { id: string; email: string; name: string };
}

const app = createApp();
const credentials = { email: 'analyst@example.com', password: 'correct-horse-battery' };
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
let userId: string;
let storedHash: string;

const login = (body: object, target = app) => request(target).post('/api/auth/login').send(body);
const getMe = (authorization?: string) => {
  const req = request(app).get('/api/auth/me');
  return authorization ? req.set('Authorization', authorization) : req;
};
const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

beforeAll(async () => {
  await connectTestDb();
  await clearTestDb();
  storedHash = await hashPassword(credentials.password);
  const user = await UserModel.create({
    email: credentials.email,
    name: 'Demo Analyst',
    passwordHash: storedHash,
  });
  userId = user._id.toString();
});

afterAll(async () => {
  await clearTestDb();
  await disconnectDb();
});

describe('POST /api/auth/login', () => {
  it('returns an HS256 token, its expiry and the user for valid credentials', async () => {
    const before = Date.now();
    const res = await login(credentials);
    const after = Date.now();

    expect(res.status).toBe(200);
    const body = res.body as LoginResponse;
    expect(body.user).toEqual({ id: userId, email: credentials.email, name: 'Demo Analyst' });

    // iat is whole seconds taken mid-request, so expiry is 8h after some instant in this window.
    const expiresAt = new Date(body.expiresAt).getTime();
    expect(expiresAt).toBeGreaterThanOrEqual(before - 1000 + EIGHT_HOURS_MS);
    expect(expiresAt).toBeLessThanOrEqual(after + EIGHT_HOURS_MS);

    const decoded = jwt.decode(body.token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
    expect(decoded?.payload).toMatchObject({ sub: userId });
    expect((await getMe(`Bearer ${body.token}`)).status).toBe(200);
  });

  it('matches the email regardless of case and surrounding spaces', async () => {
    const res = await login({ ...credentials, email: '  Analyst@Example.COM ' });

    expect(res.status).toBe(200);
  });

  it('rejects a wrong password', async () => {
    const res = await login({ ...credentials, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
    });
  });

  it('answers an unknown email exactly like a wrong password', async () => {
    const unknown = await login({ email: 'nobody@example.com', password: 'whatever' });
    const wrongPassword = await login({ ...credentials, password: 'wrong-password' });

    expect(unknown.status).toBe(401);
    expect(unknown.body).toEqual(wrongPassword.body);
  });

  it('still runs a bcrypt compare for an unknown email, so timing does not reveal accounts', async () => {
    vi.mocked(verifyPassword).mockClear();

    await login({ email: 'nobody@example.com', password: 'whatever' });

    expect(verifyPassword).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed body with one detail per bad field', async () => {
    const res = await login({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    const { error } = res.body as ErrorBody;
    expect(error.code).toBe('VALIDATION_ERROR');
    expect((error.details as { path: string }[]).map((detail) => detail.path)).toEqual([
      'email',
      'password',
    ]);
  });

  it('blocks the 11th failed attempt, not counting successful logins', async () => {
    // A fresh app, so this test's attempts don't share counters with the others.
    const limitedApp = createApp();
    const wrong = { ...credentials, password: 'wrong-password' };

    for (let attempt = 1; attempt <= 9; attempt++) {
      expect((await login(wrong, limitedApp)).status).toBe(401);
    }
    expect((await login(credentials, limitedApp)).status).toBe(200);
    expect((await login(wrong, limitedApp)).status).toBe(401);

    const blocked = await login(credentials, limitedApp);
    expect(blocked.status).toBe(429);
    const { error } = blocked.body as ErrorBody;
    expect(error.code).toBe('RATE_LIMITED');
    const { retryAfterSeconds } = error.details as { retryAfterSeconds: number };
    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user for a valid token', async () => {
    const { token } = signAccessToken(userId);

    const res = await getMe(`Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: { id: userId, email: credentials.email, name: 'Demo Analyst' },
    });
  });

  it('rejects a request without a token', async () => {
    const res = await getMe();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  });

  it.each([
    ['a value that is not a JWT', () => 'Bearer not-a-jwt'],
    ['a non-Bearer scheme', () => `Basic ${signAccessToken(userId).token}`],
    [
      'a token signed with another secret',
      () => `Bearer ${jwt.sign({ sub: userId }, 'some-other-secret-at-least-32-chars!!')}`,
    ],
    [
      'an unsigned "alg: none" token',
      () =>
        `Bearer ${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub: userId, exp: 9_999_999_999 })}.`,
    ],
    [
      'a subject that is not a user id',
      () => `Bearer ${jwt.sign({ sub: 'user_001' }, env.JWT_SECRET)}`,
    ],
  ])('rejects %s', async (_label, authorization) => {
    const res = await getMe(authorization());

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: { code: 'UNAUTHORIZED' } });
  });

  it('rejects an expired token with TOKEN_EXPIRED', async () => {
    const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000);
    const { token } = signAccessToken(userId, nineHoursAgo);

    const res = await getMe(`Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'TOKEN_EXPIRED', message: 'Your session has expired. Please log in again.' },
    });
  });

  it('rejects a valid token once its user has been deleted', async () => {
    const temporary = await UserModel.create({
      email: 'temporary@example.com',
      name: 'Temporary',
      passwordHash: storedHash,
    });
    const { token } = signAccessToken(temporary._id.toString());
    await temporary.deleteOne();

    const res = await getMe(`Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});

describe('password hash exposure', () => {
  it('never includes the hash in the login or /me responses', async () => {
    const loginRes = await login(credentials);
    const meRes = await getMe(`Bearer ${(loginRes.body as LoginResponse).token}`);

    for (const res of [loginRes, meRes]) {
      expect(res.text).not.toContain('passwordHash');
      expect(res.text).not.toContain(storedHash);
    }
  });
});
