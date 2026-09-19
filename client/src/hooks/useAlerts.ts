import { useContext } from 'react';
import { AlertContext, type AlertContextValue } from '../providers/alertContext';

export function useAlerts(): AlertContextValue {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlerts must be used inside <AlertProvider>');
  return context;
}
