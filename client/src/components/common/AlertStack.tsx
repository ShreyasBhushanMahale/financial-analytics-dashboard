import { Alert, Stack } from '@mui/material';
import type { AlertInput } from '../../providers/alertContext';

export interface VisibleAlert extends AlertInput {
  id: number;
}

interface AlertStackProps {
  alerts: VisibleAlert[];
  onDismiss: (id: number) => void;
}

/** The alert chips, stacked in the top-right corner above everything else. */
export function AlertStack({ alerts, onDismiss }: AlertStackProps) {
  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        left: { xs: 16, sm: 'auto' },
        zIndex: (theme) => theme.zIndex.snackbar,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          severity={alert.severity}
          variant="outlined"
          onClose={() => onDismiss(alert.id)}
          sx={{
            pointerEvents: 'auto',
            maxWidth: 440,
            borderRadius: 999,
            alignItems: 'center',
            py: 0,
            px: 2,
            bgcolor: 'background.paper',
            boxShadow: 8,
          }}
        >
          {alert.message}
        </Alert>
      ))}
    </Stack>
  );
}
