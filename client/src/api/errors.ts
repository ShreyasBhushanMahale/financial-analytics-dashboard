import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../types/api';

/** Every failed request becomes one of these, so the UI only ever handles one error shape. */
export class ApiError extends Error {
  /** HTTP status, or null when no response arrived at all. */
  readonly status: number | null;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number | null, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const { error } = value;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

const UNREACHABLE = "Can't reach the server. Check your connection, and that the API is running.";

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!isAxiosError(error)) return new ApiError(null, 'UNKNOWN', 'Something went wrong.');

  const { response } = error;
  if (response && isApiErrorBody(response.data)) {
    const { code, message, details } = response.data.error;
    return new ApiError(response.status, code, message, details);
  }
  // The API always answers with an error body, so a 5xx without one came from something in
  // front of it (in development, the Vite proxy reporting that port 4000 is down).
  if (response && response.status >= 500) {
    return new ApiError(response.status, 'UNREACHABLE', UNREACHABLE);
  }
  if (response) {
    return new ApiError(response.status, 'HTTP_ERROR', `Unexpected response (${response.status}).`);
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError(null, 'TIMEOUT', 'The server took too long to respond. Please try again.');
  }
  return new ApiError(null, 'UNREACHABLE', UNREACHABLE);
}
