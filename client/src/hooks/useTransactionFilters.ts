import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import {
  countActiveFilters,
  filtersToParams,
  parseFilters,
  type TransactionFilters,
} from '../utils/filterParams';

const FILTER_KEYS = [
  'search',
  'dateFrom',
  'dateTo',
  'amountMin',
  'amountMax',
  'categories',
  'statuses',
  'userIds',
] as const;

/**
 * The single source of truth for the active filters: the URL query string. Cards, charts and the
 * table all read from here, so they always describe the same transactions. A filtered view can
 * be bookmarked or shared, and Back undoes a filter change.
 */
export function useTransactionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Keyed on the string so the object keeps its identity until a filter actually changes.
  const paramString = searchParams.toString();
  const filters = useMemo(() => parseFilters(new URLSearchParams(paramString)), [paramString]);

  /** Merges `changes` into the current filters; `undefined` removes a filter. */
  const setFilters = useCallback(
    (changes: Partial<TransactionFilters>) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        const merged = { ...parseFilters(current), ...changes };
        for (const key of FILTER_KEYS) next.delete(key);
        for (const [key, value] of filtersToParams(merged)) next.set(key, value);
        // Any filter change invalidates the current page number.
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const key of FILTER_KEYS) next.delete(key);
      next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  return {
    filters,
    setFilters,
    clearFilters,
    activeFilterCount: countActiveFilters(filters),
  };
}
