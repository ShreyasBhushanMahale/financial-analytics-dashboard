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

http.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = toApiError(error);
  // A 401 from the login form means wrong credentials, not an expired session.
  const isLogin = axios.isAxiosError(error) && error.config?.url === LOGIN_PATH;
  if (apiError.status === 401 && !isLogin) onUnauthorized?.(apiError);
  return Promise.reject(apiError);
});
