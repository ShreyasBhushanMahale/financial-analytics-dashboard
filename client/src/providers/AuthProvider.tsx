import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, login } from '../api/auth';
import { setUnauthorizedHandler } from '../api/http';
import { clearSession, getToken, saveSession } from '../auth/session';
import type { AuthUser } from '../types/api';
import { AuthContext, type AuthStatus } from './authContext';

const CURRENT_USER_KEY = ['auth', 'me'] as const;

/** Must sit inside QueryProvider. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(getToken);

  const currentUser = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    enabled: token !== null,
    // The user only changes at login, which writes it into the cache directly.
    staleTime: Infinity,
  });

  const endSession = useCallback(() => {
    clearSession();
    setToken(null);
  }, []);

  // Any 401 from the API (expired or revoked token) ends the session. ProtectedRoute then sends
  // the user to /login, and the failed request's own error shows as a chip.
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token: newToken, expiresAt, user }) => {
      // Nothing cached under a previous session carries into this one.
      queryClient.removeQueries();
      saveSession({ token: newToken, expiresAt });
      queryClient.setQueryData<AuthUser>(CURRENT_USER_KEY, user);
      setToken(newToken);
    },
  });

  const logout = useCallback(() => {
    endSession();
    queryClient.removeQueries();
  }, [endSession, queryClient]);

  const status: AuthStatus =
    token === null
      ? 'anonymous'
      : currentUser.data
        ? 'authenticated'
        : // A 401 would already have ended the session, so an error here means "unreachable".
          currentUser.isError
          ? 'unavailable'
          : 'loading';

  const { mutate: startLogin, isPending: isLoggingIn } = loginMutation;
  const { refetch } = currentUser;
  const value = useMemo(
    () => ({
      status,
      user: status === 'authenticated' ? (currentUser.data ?? null) : null,
      login: startLogin,
      isLoggingIn,
      logout,
      retry: () => void refetch(),
    }),
    [status, currentUser.data, startLogin, isLoggingIn, logout, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
