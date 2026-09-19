import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { toApiError } from '../api/errors';
import { AlertStack, type VisibleAlert } from '../components/common/AlertStack';
import { AlertContext, type AlertInput } from './alertContext';

const AUTO_DISMISS_MS = 6_000;
const MAX_VISIBLE = 4;

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<VisibleAlert[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  }, []);

  const notify = useCallback(
    (alert: AlertInput) => {
      const id = nextId.current++;
      setAlerts((current) => {
        // When several requests fail for one reason (API down, session expired), show one chip.
        const isDuplicate = current.some(
          (visible) => visible.severity === alert.severity && visible.message === alert.message,
        );
        return isDuplicate ? current : [...current, { ...alert, id }].slice(-MAX_VISIBLE);
      });
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const notifyError = useCallback(
    (error: unknown) => notify({ severity: 'error', message: toApiError(error).message }),
    [notify],
  );

  const value = useMemo(() => ({ notify, notifyError }), [notify, notifyError]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertStack alerts={alerts} onDismiss={dismiss} />
    </AlertContext.Provider>
  );
}
