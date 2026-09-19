import { Box, Stack, Typography } from '@mui/material';

export interface LegendItem {
  label: string;
  color: string;
}

/** The dot-and-label legend from the design's Overview header. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
