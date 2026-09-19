import { useTheme } from '@mui/material/styles';

/** Recharts needs plain colour strings, so they're read from the theme here, never hard-coded. */
export function useChartColors() {
  const { palette } = useTheme();
  return {
    revenue: palette.success.main,
    expense: palette.warning.main,
    grid: palette.divider,
    axis: palette.text.secondary,
    surface: palette.background.paper,
  };
}
