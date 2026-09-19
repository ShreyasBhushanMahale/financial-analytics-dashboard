import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';
import { Box, Button, Typography } from '@mui/material';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  minHeight?: number;
}

/**
 * Takes the place of a failed block. The alert chip already carries the server's reason, so this
 * only says what is missing and offers a retry.
 */
export function ErrorState({ message, onRetry, minHeight = 200 }: ErrorStateProps) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        textAlign: 'center',
      }}
    >
      <ErrorOutlineRounded color="error" fontSize="large" />
      <Typography color="text.secondary">{message}</Typography>
      <Button variant="outlined" size="small" onClick={onRetry}>
        Try again
      </Button>
    </Box>
  );
}
