import axios from 'axios';
import { getToken } from '../auth/session';
import { toApiError, type ApiError } from './errors';

export const LOGIN_PATH = '/auth/login';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
});

type UnauthorizedHandler = (error: ApiError) => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/**
 * The auth provider registers how to end the session. This module only notices the 401, so it
 * stays free of React and routing.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// FileReader rather than Blob.text(): it works in every browser the app supports and in jsdom.
function blobToText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the response'));
    reader.readAsText(blob);
  });
}

/**
 * Requests made with `responseType: 'blob'` (the CSV export) receive their JSON error body as a
 * Blob too. Reading it back into JSON means the user sees the server's actual message.
 */
async function readBlobErrorBody(error: unknown): Promise<void> {
  if (!axios.isAxiosError(error) || !(error.response?.data instanceof Blob)) return;
  try {
    error.response.data = JSON.parse(await blobToText(error.response.data)) as unknown;
  } catch {
    // Not JSON (a proxy error page, say): toApiError falls back to a generic message.
  }
}

http.interceptors.response.use(undefined, async (error: unknown) => {
  await readBlobErrorBody(error);
  const apiError = toApiError(error);
  // A 401 from the login form means wrong credentials, not an expired session.
  const isLogin = axios.isAxiosError(error) && error.config?.url === LOGIN_PATH;
  if (apiError.status === 401 && !isLogin) onUnauthorized?.(apiError);
  return Promise.reject(apiError);
});
