import type { AlertColor } from '@mui/material';
import { createContext } from 'react';

export interface AlertInput {
  severity: AlertColor;
  message: string;
}

export interface AlertContextValue {
  notify: (alert: AlertInput) => void;
  /** Shows any thrown value as an error chip, using the server's message when there is one. */
  notifyError: (error: unknown) => void;
}

export const AlertContext = createContext<AlertContextValue | null>(null);
