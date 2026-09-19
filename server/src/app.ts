import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { createApiRouter } from './routes/index.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      // Browsers hide this header from cross-origin JS unless it's exposed,
      // and the client needs it to name downloaded CSV files.
      exposedHeaders: ['Content-Disposition'],
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', createApiRouter());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
