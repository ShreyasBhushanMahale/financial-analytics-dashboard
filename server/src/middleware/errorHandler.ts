import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorBody } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import { describeIssues } from '../utils/zodIssues.js';

// body-parser tags its errors with a `type` string; that is the stable way to recognise them.
function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'type' in err && typeof err.type === 'string') {
    return err.type;
  }
  return undefined;
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', describeIssues(err));
  }

  switch (bodyParserErrorType(err)) {
    case 'entity.parse.failed':
      return new AppError(400, 'VALIDATION_ERROR', 'Request body is not valid JSON');
    case 'entity.too.large':
      return new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
  }

  // Anything unrecognised may carry internals (queries, stack traces), so the client gets a generic message.
  logger.error('Unhandled error', err);
  return new AppError(500, 'INTERNAL_ERROR', 'Something went wrong. Please try again.');
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // Once a response has started streaming (e.g. a CSV export) its status can't change;
  // Express's default handler then closes the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  const { status, code, message, details } = toAppError(err);
  const body: ErrorBody = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  res.status(status).json(body);
};
