import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AppError } from '../../src/errors/AppError.js';
import { errorHandler } from '../../src/middleware/errorHandler.js';

// A bare app with routes that fail in each way the handler must translate.
const app = express();
app.get('/app-error', () => {
  throw new AppError(404, 'NOT_FOUND', 'Transaction 42 not found', { id: 42 });
});
app.get('/zod-error', () => {
  z.object({ page: z.number().min(1) }).parse({ page: 0 });
});
app.get('/unexpected', () => {
  throw new Error('connection string mongodb://admin:hunter2@db leaked');
});
app.use(errorHandler);

describe('errorHandler', () => {
  it('sends an AppError with its own status, code, message and details', async () => {
    const res = await request(app).get('/app-error');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Transaction 42 not found', details: { id: 42 } },
    });
  });

  it('turns a ZodError into a 400 with one detail per issue', async () => {
    const res = await request(app).get('/zod-error');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ path: 'page', message: 'Too small: expected number to be >=1' }],
      },
    });
  });

  it('hides the message of unexpected errors behind a generic 500', async () => {
    const res = await request(app).get('/unexpected');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
    });
    expect(res.text).not.toContain('hunter2');
  });
});
