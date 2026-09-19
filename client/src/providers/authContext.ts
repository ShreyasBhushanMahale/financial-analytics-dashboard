import { createContext } from 'react';
import type { Credentials } from '../api/auth';
import type { AuthUser } from '../types/api';

/**
 * - loading: a stored token is being checked against the API.
 * - authenticated: the token is valid and `user` is set.
 * - anonymous: no token, or the API rejected it.
 * - unavailable: a token exists but the API couldn't be reached to check it.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (credentials: Credentials) => void;
  isLoggingIn: boolean;
  logout: () => void;
  /** Checks the stored token again after the API was unavailable. */
  retry: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
