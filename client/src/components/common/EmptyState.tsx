import SearchOffRounded from '@mui/icons-material/SearchOffRounded';
import { Box, Button, Typography } from '@mui/material';

interface EmptyStateProps {
  message: string;
  /** Offered when filters caused the emptiness, so the way out is one click away. */
  onClearFilters?: () => void;
  minHeight?: number;
}

export function EmptyState({ message, onClearFilters, minHeight = 200 }: EmptyStateProps) {
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
        color: 'text.secondary',
      }}
    >
      <SearchOffRounded fontSize="large" />
      <Typography>{message}</Typography>
      {onClearFilters && (
        <Button variant="outlined" size="small" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </Box>
  );
}
