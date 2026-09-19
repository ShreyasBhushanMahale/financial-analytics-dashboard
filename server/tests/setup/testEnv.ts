import { inject } from 'vitest';

// Runs in each test worker before the test file imports src/, so config/env.ts validates
// these values instead of anything in server/.env.
process.env.MONGODB_URI = inject('mongoUri');
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '8h';
