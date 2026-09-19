import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchFilterOptions,
  fetchTransactions,
  type TransactionListQuery,
} from '../api/transactions';

/** One page of the table. The previous page stays on screen (dimmed) while the next one loads. */
export function useTransactions(query: TransactionListQuery) {
  return useQuery({
    queryKey: ['transactions', 'list', query],
    queryFn: () => fetchTransactions(query),
    placeholderData: keepPreviousData,
  });
}

/** Valid filter choices and data bounds. They only change when data is re-seeded. */
export function useFilterOptions() {
  return useQuery({
    queryKey: ['transactions', 'filter-options'],
    queryFn: fetchFilterOptions,
    staleTime: 5 * 60_000,
  });
}
