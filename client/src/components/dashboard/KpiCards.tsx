import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import CreditCardOutlined from '@mui/icons-material/CreditCardOutlined';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import { Box, Paper } from '@mui/material';
import { useSummary } from '../../hooks/useAnalytics';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import type { Summary } from '../../types/api';
import { formatCount, formatMoney } from '../../utils/format';
import { ErrorState } from '../common/ErrorState';
import { KpiCard, type KpiCardProps } from './KpiCard';

const plural = (count: number, noun: string) =>
  `${formatCount(count)} ${noun}${count === 1 ? '' : 's'}`;

// The design's fourth card is "Savings"; there's no savings data, so it shows what's pending.
function cardsFor(summary: Summary | undefined): KpiCardProps[] {
  const totals = summary?.totals;
  const byCategory = (key: 'Revenue' | 'Expense') =>
    summary?.byCategory.find((entry) => entry.key === key)?.count ?? 0;

  return [
    {
      label: 'Balance',
      icon: AccountBalanceWalletOutlined,
      tone: 'success',
      value: totals && formatMoney(totals.net),
      caption: 'Revenue minus expenses',
    },
    {
      label: 'Revenue',
      icon: TrendingUpRounded,
      tone: 'success',
      value: totals && formatMoney(totals.revenue),
      caption: plural(byCategory('Revenue'), 'transaction'),
    },
    {
      label: 'Expenses',
      icon: CreditCardOutlined,
      tone: 'warning',
      value: totals && formatMoney(totals.expense),
      caption: plural(byCategory('Expense'), 'transaction'),
    },
    {
      label: 'Pending',
      icon: ScheduleRounded,
      tone: 'warning',
      value: totals && formatMoney(totals.pending),
      caption: totals && `${plural(totals.pendingCount, 'transaction')} awaiting payment`,
    },
  ];
}

export function KpiCards() {
  const { filters } = useTransactionFilters();
  const summary = useSummary(filters);

  if (summary.isError) {
    return (
      <Paper sx={{ p: 2 }}>
        <ErrorState
          message="Couldn't load the summary figures."
          onRetry={() => void summary.refetch()}
          minHeight={96}
        />
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 2, md: 3 },
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        opacity: summary.isPlaceholderData ? 0.55 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      {cardsFor(summary.data).map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </Box>
  );
}
