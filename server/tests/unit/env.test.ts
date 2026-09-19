import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { envSchema } from '../../src/config/env.js';

const valid = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/finance_dashboard',
  JWT_SECRET: 'a-real-secret-that-is-comfortably-longer-than-32-chars',
};

describe('envSchema: JWT_SECRET', () => {
  it('accepts a real secret of 32+ characters', () => {
    expect(envSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects the placeholder shipped in .env.example, even though it is long enough', () => {
    const example = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8');
    const placeholder = /^JWT_SECRET=(.*)$/m.exec(example)?.[1];
    expect(placeholder?.length).toBeGreaterThanOrEqual(32);

    const result = envSchema.safeParse({ ...valid, JWT_SECRET: placeholder });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/placeholder from \.env\.example/);
  });

  it('rejects a secret shorter than 32 characters', () => {
    expect(envSchema.safeParse({ ...valid, JWT_SECRET: 'short' }).success).toBe(false);
  });
});
