import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/setup/globalSetup.ts'],
    setupFiles: ['tests/setup/testEnv.ts'],
    // Integration test files share one database, so they run one after another.
    fileParallelism: false,
  },
});
