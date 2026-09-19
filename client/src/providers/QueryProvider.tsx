import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { createQueryClient } from '../api/queryClient';
import { useAlerts } from '../hooks/useAlerts';

/** Must sit inside AlertProvider: every failed query or mutation is reported as an alert chip. */
export function QueryProvider({ children }: { children: ReactNode }) {
  const { notifyError } = useAlerts();
  // Created once per app, not per render; notifyError is stable, so capturing it here is safe.
  const [queryClient] = useState(() => createQueryClient(notifyError));

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
