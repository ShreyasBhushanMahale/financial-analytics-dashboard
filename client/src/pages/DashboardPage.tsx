import { Box, Stack } from '@mui/material';
import { BreakdownPanels } from '../components/dashboard/BreakdownPanels';
import { FilterNotice } from '../components/dashboard/FilterNotice';
import { KpiCards } from '../components/dashboard/KpiCards';
import { OverviewPanel } from '../components/dashboard/OverviewPanel';
import { RecentTransactionsPanel } from '../components/dashboard/RecentTransactionsPanel';
import { TransactionsPanel } from '../components/transactions/TransactionsPanel';

// Every block reads the same URL filters, so the cards, charts and table always agree.
export function DashboardPage() {
  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <FilterNotice />
      <KpiCards />
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(0, 1fr)' },
        }}
      >
        <OverviewPanel />
        <RecentTransactionsPanel />
      </Box>
      <BreakdownPanels />
      <TransactionsPanel />
    </Stack>
  );
}
