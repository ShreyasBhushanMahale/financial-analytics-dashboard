import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Status } from '../../types/api';

// Paid is settled (green); Pending still needs attention (yellow), as in the design.
const TONE: Record<Status, 'success' | 'warning'> = { Paid: 'success', Pending: 'warning' };

export function StatusPill({ status }: { status: Status }) {
  const tone = TONE[status];
  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: 'inline-block',
        px: 1.5,
        py: 0.25,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.6,
        color: theme.palette[tone].main,
        bgcolor: alpha(theme.palette[tone].main, 0.2),
      })}
    >
      {status}
    </Box>
  );
}
