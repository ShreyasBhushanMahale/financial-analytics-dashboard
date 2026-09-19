import { Box, Typography } from '@mui/material';

interface LogoProps {
  /** Hide the wordmark and show only the mark (narrow sidebar). */
  compactBelow?: 'md';
}

export function Logo({ compactBelow }: LogoProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        component="svg"
        viewBox="0 0 32 32"
        sx={{ width: 32, height: 32, color: 'primary.main' }}
      >
        <path
          d="M10 6v20h14"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Box>
      <Typography
        component="span"
        variant="h5"
        sx={{
          fontWeight: 700,
          letterSpacing: '-0.02em',
          display: compactBelow ? { xs: 'none', [compactBelow]: 'inline' } : 'inline',
        }}
      >
        Ledgerline
      </Typography>
    </Box>
  );
}
