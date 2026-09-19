import { Box, Button, CircularProgress, Typography } from '@mui/material';

type FullPageStatusProps = { kind: 'loading' } | { kind: 'unavailable'; onRetry: () => void };

/** Shown before the app shell exists: while a stored session is checked, or if that check can't run. */
export function FullPageStatus(props: FullPageStatusProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.deep',
        p: 2,
        textAlign: 'center',
      }}
    >
      {props.kind === 'loading' ? (
        <CircularProgress aria-label="Checking your session" />
      ) : (
        <Box sx={{ maxWidth: 360 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Can&apos;t reach the server
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Your session is saved. Check your connection and that the API is running, then try
            again.
          </Typography>
          <Button variant="contained" onClick={props.onRetry}>
            Try again
          </Button>
        </Box>
      )}
    </Box>
  );
}
