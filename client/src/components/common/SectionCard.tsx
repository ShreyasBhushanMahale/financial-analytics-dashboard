import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  /** Rendered on the right of the header: a legend, a link, a button. */
  action?: ReactNode;
  children: ReactNode;
}

/** A dark panel with a title row, as used for every block on the dashboard. */
export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
  return (
    <Paper
      component="section"
      aria-label={title}
      sx={{ p: { xs: 2, md: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Box>
          <Typography component="h2" variant="h6">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Paper>
  );
}
