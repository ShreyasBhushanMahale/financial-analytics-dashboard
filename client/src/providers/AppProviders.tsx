import { CssBaseline, ThemeProvider } from '@mui/material';
import type { ReactNode } from 'react';
import { theme } from '../theme/theme';
import { AlertProvider } from './AlertProvider';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';

/** Order matters: queries report errors to the alerts, and auth runs its checks as queries. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AlertProvider>
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
