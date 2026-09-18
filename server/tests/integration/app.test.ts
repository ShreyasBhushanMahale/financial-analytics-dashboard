import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';

const app = createApp();

describe('app wiring', () => {
  it('answers unknown routes with a 404 in the standard error shape', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist does not exist' },
    });
  });

  it('rejects a malformed JSON body with a 400', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' },
    });
  });

  it('rejects a body over the size limit with a 413', async () => {
    const res = await request(app)
      .post('/api/health')
      .send({ padding: 'x'.repeat(150 * 1024) });

    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ error: { code: 'PAYLOAD_TOO_LARGE' } });
  });

  it('allows the configured client origin and exposes Content-Disposition', async () => {
    const res = await request(app).get('/api/does-not-exist').set('Origin', env.CLIENT_ORIGIN);

    expect(res.headers['access-control-allow-origin']).toBe(env.CLIENT_ORIGIN);
    expect(res.headers['access-control-expose-headers']).toBe('Content-Disposition');
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
