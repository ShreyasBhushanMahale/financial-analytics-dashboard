import { Box, Button, Skeleton, Stack } from '@mui/material';
import { Link } from 'react-router';
import { RECENT_COUNT, useRecentTransactions } from '../../hooks/useRecentTransactions';
import { DataState } from '../common/DataState';
import { EmptyState } from '../common/EmptyState';
import { SectionCard } from '../common/SectionCard';
import { RecentTransactionsList } from './RecentTransactionsList';

const skeleton = (
  <Stack spacing={2}>
    {Array.from({ length: RECENT_COUNT }, (_, index) => (
      <Stack key={index} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Skeleton variant="rounded" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </Box>
        <Skeleton variant="text" width={72} />
      </Stack>
    ))}
  </Stack>
);

export function RecentTransactionsPanel() {
  const recent = useRecentTransactions();

  return (
    <SectionCard
      title="Latest transactions"
      subtitle={`${RECENT_COUNT} most recent overall · not affected by filters`}
      action={
        <Button component={Link} to="/transactions" size="small">
          See all
        </Button>
      }
    >
      <DataState
        query={recent}
        skeleton={skeleton}
        isEmpty={(transactions) => transactions.length === 0}
        empty={<EmptyState message="No transactions yet." />}
        errorMessage="Couldn't load the latest transactions."
      >
        {(transactions) => <RecentTransactionsList transactions={transactions} />}
      </DataState>
    </SectionCard>
  );
}
