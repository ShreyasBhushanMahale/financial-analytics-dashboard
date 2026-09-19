import { Stack } from '@mui/material';
import { useCallback } from 'react';
import { useTableParams } from '../../hooks/useTableParams';
import { useFilterOptions, useTransactions } from '../../hooks/useTransactions';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import { formatCount } from '../../utils/format';
import { SectionCard } from '../common/SectionCard';
import { ActiveFilterChips } from './ActiveFilterChips';
import { DateRangeButton } from './DateRangeButton';
import { FiltersButton } from './FiltersButton';
import { SearchField } from './SearchField';
import { TransactionsResults } from './TransactionsResults';

/**
 * The transactions table with its search, filters and paging. Used on the dashboard and, full
 * page, on /transactions. All state lives in the URL, through useTransactionFilters and
 * useTableParams, so both places share links and Back/Forward history.
 */
export function TransactionsPanel() {
  const { filters, setFilters, clearFilters, activeFilterCount } = useTransactionFilters();
  const table = useTableParams();
  const filterOptions = useFilterOptions();
  const transactions = useTransactions({
    filters,
    page: table.page,
    pageSize: table.pageSize,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  });

  const commitSearch = useCallback((search?: string) => setFilters({ search }), [setFilters]);
  const total = transactions.data?.meta.total;

  return (
    <SectionCard
      title="Transactions"
      subtitle={
        total === undefined
          ? undefined
          : `${formatCount(total)} ${activeFilterCount > 0 ? 'matching' : 'in total'}`
      }
      action={
        <Stack
          direction="row"
          sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}
        >
          <SearchField value={filters.search ?? ''} onCommit={commitSearch} />
          <DateRangeButton
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            bounds={filterOptions.data?.dateRange ?? null}
            onApply={setFilters}
          />
          <FiltersButton filters={filters} options={filterOptions.data} onChange={setFilters} />
        </Stack>
      }
    >
      <Stack spacing={2}>
        <ActiveFilterChips filters={filters} onChange={setFilters} onClearAll={clearFilters} />
        <TransactionsResults
          query={transactions}
          table={table}
          hasFilters={activeFilterCount > 0}
          onClearFilters={clearFilters}
        />
      </Stack>
    </SectionCard>
  );
}
