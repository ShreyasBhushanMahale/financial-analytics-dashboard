import { useQuery } from '@tanstack/react-query';
import { fetchTransactions } from '../api/transactions';

export const RECENT_COUNT = 5;

/** The newest transactions overall. Deliberately ignores the dashboard filters: it's a feed. */
export function useRecentTransactions() {
  return useQuery({
    queryKey: ['transactions', 'recent', RECENT_COUNT],
    queryFn: () =>
      fetchTransactions({
        filters: {},
        page: 1,
        pageSize: RECENT_COUNT,
        sortBy: 'date',
        sortOrder: 'desc',
      }),
    select: (page) => page.data,
  });
}
