import { Box, Button, TablePagination, Typography } from '@mui/material';
import type { UseQueryResult } from '@tanstack/react-query';
import { PAGE_SIZES, type useTableParams } from '../../hooks/useTableParams';
import type { TransactionPage } from '../../types/api';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { TransactionsTable } from './TransactionsTable';

interface TransactionsResultsProps {
  query: UseQueryResult<TransactionPage>;
  table: ReturnType<typeof useTableParams>;
  hasFilters: boolean;
  onClearFilters: () => void;
}

/** The table plus its loading, error, empty and paging states. */
export function TransactionsResults({
  query,
  table,
  hasFilters,
  onClearFilters,
}: TransactionsResultsProps) {
  const sortProps = { sortBy: table.sortBy, sortOrder: table.sortOrder, onSort: table.toggleSort };

  if (query.isPending) {
    return (
      <TransactionsTable rows={[]} {...sortProps} skeletonRows={Math.min(table.pageSize, 10)} />
    );
  }
  if (query.isError) {
    return (
      <ErrorState message="Couldn't load transactions." onRetry={() => void query.refetch()} />
    );
  }

  const { data, meta } = query.data;
  if (meta.total === 0) {
    return hasFilters ? (
      <EmptyState message="No transactions match these filters." onClearFilters={onClearFilters} />
    ) : (
      <EmptyState message="No transactions yet." />
    );
  }
  if (data.length === 0) {
    // A shared link or Back can land beyond the last page after the data or filters change.
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Page {meta.page} is past the end: there are {meta.totalPages} pages.
        </Typography>
        <Button variant="outlined" onClick={() => table.setPage(1)}>
          Go to page 1
        </Button>
      </Box>
    );
  }

  return (
    // The previous page stays on screen, dimmed, while the next one loads.
    <Box
      aria-busy={query.isPlaceholderData}
      sx={{ opacity: query.isPlaceholderData ? 0.55 : 1, transition: 'opacity 150ms ease' }}
    >
      <TransactionsTable rows={data} {...sortProps} />
      <TablePagination
        component="div"
        count={meta.total}
        page={meta.page - 1}
        rowsPerPage={meta.pageSize}
        rowsPerPageOptions={[...PAGE_SIZES]}
        onPageChange={(_event, zeroBasedPage) => table.setPage(zeroBasedPage + 1)}
        onRowsPerPageChange={(event) => table.setPageSize(Number(event.target.value))}
        showFirstButton
        showLastButton
      />
    </Box>
  );
}
