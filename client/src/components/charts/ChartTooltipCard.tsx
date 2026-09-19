import { Box, Paper, Typography } from '@mui/material';

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

/** The floating card every chart uses on hover. */
export function ChartTooltipCard({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <Paper elevation={8} sx={{ px: 1.5, py: 1, minWidth: 170 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'baseline' }}
        >
          <Typography variant="body2" sx={{ color: row.color ?? 'text.primary' }}>
            {row.label}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {row.value}
          </Typography>
        </Box>
      ))}
    </Paper>
  );
}
