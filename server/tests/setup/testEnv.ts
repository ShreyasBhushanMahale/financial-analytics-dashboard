import { inject } from 'vitest';

// Runs in each test worker before the test file imports src/, so config/env.ts
// validates the in-memory database URI instead of anything in server/.env.
process.env.MONGODB_URI = inject('mongoUri');
