import FilterAltOutlined from '@mui/icons-material/FilterAltOutlined';
import { Alert, Button, Chip } from '@mui/material';
import { useSummary } from '../../hooks/useAnalytics';
import { useTransactionFilters } from '../../hooks/useTransactionFilters';
import { formatCount } from '../../utils/format';

/**
 * Makes a filtered dashboard impossible to mistake for the full picture: the cards and charts
 * below describe only the matching transactions.
 */
export function FilterNotice() {
  const { filters, activeFilterCount, clearFilters } = useTransactionFilters();
  const summary = useSummary(filters);

  if (activeFilterCount === 0) return null;

  const matching = summary.data ? formatCount(summary.data.totals.count) : '…';
  return (
    <Alert
      role="status"
      severity="info"
      variant="outlined"
      icon={<FilterAltOutlined />}
      action={
        <Button color="inherit" size="small" onClick={clearFilters}>
          Clear filters
        </Button>
      }
      sx={{ alignItems: 'center', bgcolor: 'background.paper' }}
    >
      <Chip label="Filtered" size="small" color="info" sx={{ mr: 1, fontWeight: 600 }} />
      Cards, charts and breakdowns show the {matching} transactions matching{' '}
      {activeFilterCount === 1 ? 'your filter' : `${activeFilterCount} filters`}.
    </Alert>
  );
}
