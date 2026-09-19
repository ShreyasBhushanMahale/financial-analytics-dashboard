import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toApiError } from './errors';

// A 4xx will fail the same way again. Only a network problem or a 5xx is worth one more try.
function isRetryable(error: unknown): boolean {
  const { status } = toApiError(error);
  return status === null || status >= 500;
}

/**
 * Every failed query and mutation reports through `onError`, once its retries are used up. That
 * single hook is what puts every API error in front of the user as an alert chip.
 */
export function createQueryClient(onError: (error: unknown) => void): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => failureCount < 1 && isRetryable(error),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}
