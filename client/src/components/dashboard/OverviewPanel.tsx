import { Skeleton } from '@mui/material';
import { useMonthlyTrend } from '../../hooks/useAnalytics';
import { useChartColors } from '../../hooks/useChartColors';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import { ChartLegend } from '../charts/ChartLegend';
import { DataState } from '../common/DataState';
import { EmptyState } from '../common/EmptyState';
import { SectionCard } from '../common/SectionCard';
import { OverviewChart } from './OverviewChart';

const CHART_HEIGHT = 280;

export function OverviewPanel() {
  const { filters, clearFilters } = useTransactionFilters();
  const trend = useMonthlyTrend(filters);
  const colors = useChartColors();

  return (
    <SectionCard
      title="Overview"
      subtitle="Revenue and expenses per month (UTC)"
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
        query={trend}
        skeleton={<Skeleton variant="rounded" height={CHART_HEIGHT} />}
        isEmpty={(points) => points.length === 0}
        empty={
          <EmptyState
            message="No transactions match these filters."
            onClearFilters={clearFilters}
            minHeight={CHART_HEIGHT}
          />
        }
        errorMessage="Couldn't load the overview chart."
      >
        {(points) => <OverviewChart points={points} height={CHART_HEIGHT} />}
      </DataState>
    </SectionCard>
  );
}
