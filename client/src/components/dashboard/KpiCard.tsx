import type { SvgIconComponent } from '@mui/icons-material';
import { Box, Paper, Skeleton, Typography } from '@mui/material';

export interface KpiCardProps {
  label: string;
  icon: SvgIconComponent;
  /** Green for money in, yellow for money out or outstanding. */
  tone: 'success' | 'warning';
  /** Formatted value; omit while loading to show a skeleton. */
  value?: string;
  caption?: string;
}

/** One summary card from the design: an icon tile, a label and a large figure. */
export function KpiCard({ label, icon: Icon, tone, value, caption }: KpiCardProps) {
  return (
    <Paper sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'background.default',
          color: `${tone}.main`,
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {value === undefined ? (
          <>
            <Skeleton variant="text" width={140} sx={{ fontSize: '1.75rem' }} />
            <Skeleton variant="text" width={100} sx={{ fontSize: '0.75rem' }} />
          </>
        ) : (
          <>
            <Typography
              component="p"
              variant="h5"
              sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}
            >
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
}
