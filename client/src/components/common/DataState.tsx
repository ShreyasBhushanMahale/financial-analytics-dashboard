import { Box } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface DataStateProps<T> {
  query: UseQueryResult<T>;
  /** Shown on the first load, shaped like the content it stands in for. */
  skeleton: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  /** What failed to load, for the error block ("Couldn't load the overview"). */
  errorMessage: string;
  children: (data: T) => ReactNode;
}

/**
 * The loading, error and empty states every data block needs, in one place. While new filters
 * load, the previous result stays visible but dimmed, so the layout doesn't jump.
 */
export function DataState<T>({
  query,
  skeleton,
  isEmpty,
  empty,
  errorMessage,
  children,
}: DataStateProps<T>) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError) {
    return <ErrorState message={errorMessage} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty?.(query.data)) return <>{empty}</>;

  return (
    <Box
      aria-busy={query.isPlaceholderData}
      sx={{ opacity: query.isPlaceholderData ? 0.55 : 1, transition: 'opacity 150ms ease' }}
    >
      {children(query.data)}
    </Box>
  );
}
