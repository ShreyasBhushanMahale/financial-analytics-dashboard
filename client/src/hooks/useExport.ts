import { useMutation, useQuery } from '@tanstack/react-query';
import { exportTransactionsCsv, fetchExportColumns } from '../api/export';
import { fetchTransactions } from '../api/transactions';
import type { SortField, SortOrder } from '../types/api';
import type { TransactionFilters } from '../utils/filterParams';

export const PREVIEW_ROWS = 3;

/** The server's column whitelist. It only changes with a deploy. */
export function useExportColumns() {
  return useQuery({
    queryKey: ['export', 'columns'],
    queryFn: fetchExportColumns,
    staleTime: Infinity,
  });
}

/**
 * The first rows of an export, in the table's current sort. The same response carries the total,
 * which is the row count shown for that scope.
 */
export function useExportPreview(
  filters: TransactionFilters,
  sortBy: SortField,
  sortOrder: SortOrder,
) {
  return useQuery({
    queryKey: ['export', 'preview', filters, sortBy, sortOrder],
    queryFn: () =>
      fetchTransactions({ filters, page: 1, pageSize: PREVIEW_ROWS, sortBy, sortOrder }),
  });
}

export function useExportCsv() {
  return useMutation({ mutationFn: exportTransactionsCsv });
}
