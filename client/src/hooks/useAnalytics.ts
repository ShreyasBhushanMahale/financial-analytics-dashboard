import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchMonthlyTrend, fetchSummary } from '../api/analytics';
import type { TransactionFilters } from '../utils/filterParams';

// keepPreviousData: while a new filter loads, the old numbers stay on screen (dimmed) rather than
// every card and chart collapsing into skeletons and back.

export function useSummary(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['analytics', 'summary', filters],
    queryFn: () => fetchSummary(filters),
    placeholderData: keepPreviousData,
  });
}

export function useMonthlyTrend(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['analytics', 'trend', filters],
    queryFn: () => fetchMonthlyTrend(filters),
    placeholderData: keepPreviousData,
  });
}
