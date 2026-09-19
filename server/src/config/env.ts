import { z } from 'zod';
import { DURATION_PATTERN } from '../utils/duration.js';
import { parseEnv } from './parseEnv.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'must start with mongodb:// or mongodb+srv://'),
  // HS256 is only as strong as its secret; 32+ characters keeps brute-forcing the signature out of reach.
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(DURATION_PATTERN, 'must be a whole number followed by s, m, h or d, like 8h')
    .default('8h'),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = parseEnv(envSchema);
