import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { SORT_FIELDS, type SortField, type SortOrder } from '../types/api';

export const PAGE_SIZES = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
const DEFAULT_SORT: { sortBy: SortField; sortOrder: SortOrder } = {
  sortBy: 'date',
  sortOrder: 'desc',
};

// Numbers and dates read best biggest/newest first; text reads best A to Z.
const FIRST_ORDER: Record<SortField, SortOrder> = {
  id: 'desc',
  date: 'desc',
  amount: 'desc',
  category: 'asc',
  status: 'asc',
  user_id: 'asc',
};

function readPage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function readPageSize(value: string | null): number {
  const size = Number(value);
  return (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE;
}

function readSortBy(value: string | null): SortField {
  return (SORT_FIELDS as readonly string[]).includes(value ?? '')
    ? (value as SortField)
    : DEFAULT_SORT.sortBy;
}

/**
 * Page, page size and sort, kept in the URL next to the filters, so a shared link opens on the
 * same page in the same order. Defaults are left out of the URL to keep it short.
 */
export function useTableParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = readPage(searchParams.get('page'));
  const pageSize = readPageSize(searchParams.get('pageSize'));
  const sortBy = readSortBy(searchParams.get('sortBy'));
  const sortOrder: SortOrder =
    searchParams.get('sortOrder') === 'asc' || searchParams.get('sortOrder') === 'desc'
      ? (searchParams.get('sortOrder') as SortOrder)
      : DEFAULT_SORT.sortOrder;

  const update = useCallback(
    (changes: Record<string, string | undefined>) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) next.delete(key);
          else next.set(key, value);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => update({ page: nextPage > 1 ? String(nextPage) : undefined }),
    [update],
  );

  // A different page size makes the current page number meaningless, so it resets to page 1.
  const setPageSize = useCallback(
    (size: number) =>
      update({
        pageSize: size === DEFAULT_PAGE_SIZE ? undefined : String(size),
        page: undefined,
      }),
    [update],
  );

  /** Clicking the sorted column flips its direction; another column starts in its natural order. */
  const toggleSort = useCallback(
    (field: SortField) => {
      const order = field === sortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : FIRST_ORDER[field];
      const isDefault = field === DEFAULT_SORT.sortBy && order === DEFAULT_SORT.sortOrder;
      update({
        sortBy: isDefault ? undefined : field,
        sortOrder: isDefault ? undefined : order,
        page: undefined,
      });
    },
    [sortBy, sortOrder, update],
  );

  return { page, pageSize, sortBy, sortOrder, setPage, setPageSize, toggleSort };
}
