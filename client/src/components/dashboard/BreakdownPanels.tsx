import { Box, Skeleton } from '@mui/material';
import { useSummary } from '../../hooks/useAnalytics';
import { useChartColors } from '../../hooks/useChartColors';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import { ChartLegend } from '../charts/ChartLegend';
import { DataState } from '../common/DataState';
import { EmptyState } from '../common/EmptyState';
import { SectionCard } from '../common/SectionCard';
import { CategoryDonut } from './CategoryDonut';
import { StatusSplitChart } from './StatusSplitChart';

const PANEL_HEIGHT = 200;

/** Category and status breakdowns. Both read the same summary request as the cards. */
export function BreakdownPanels() {
  const { filters, clearFilters } = useTransactionFilters();
  const summary = useSummary(filters);
  const colors = useChartColors();

  const empty = (
    <EmptyState
      message="No transactions match these filters."
      onClearFilters={clearFilters}
      minHeight={PANEL_HEIGHT}
    />
  );
  const isEmpty = (data: { totals: { count: number } }) => data.totals.count === 0;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 2, md: 3 },
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
      }}
    >
      <SectionCard title="By category" subtitle="Share of the money moved">
        <DataState
          query={summary}
          skeleton={<Skeleton variant="rounded" height={PANEL_HEIGHT} />}
          isEmpty={isEmpty}
          empty={empty}
          errorMessage="Couldn't load the category breakdown."
        >
          {(data) => <CategoryDonut byCategory={data.byCategory} />}
        </DataState>
      </SectionCard>
      <SectionCard
        title="By status"
        subtitle="Paid and pending amounts, split by direction"
        action={
          <ChartLegend
            items={[
              { label: 'Revenue', color: colors.revenue },
              { label: 'Expenses', color: colors.expense },
            ]}
          />
        }
      >
        <DataState
          query={summary}
          skeleton={<Skeleton variant="rounded" height={PANEL_HEIGHT} />}
          isEmpty={isEmpty}
          empty={empty}
          errorMessage="Couldn't load the status breakdown."
        >
          {(data) => <StatusSplitChart byStatus={data.byStatus} />}
        </DataState>
      </SectionCard>
    </Box>
  );
}
