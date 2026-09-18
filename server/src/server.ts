import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './db/connect.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  await connectDb(env.MONGODB_URI);
  logger.info('Connected to MongoDB');

  const server = createApp().listen(env.PORT, (error) => {
    if (error) {
      logger.error(`Could not listen on port ${env.PORT}`, error);
      process.exit(1);
    }
    logger.info(`API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      void disconnectDb().finally(() => process.exit(0));
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

main().catch((error: unknown) => {
  logger.error('Failed to start the server', error);
  process.exit(1);
});
