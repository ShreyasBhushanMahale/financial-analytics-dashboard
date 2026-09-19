import { Button, Chip, Stack } from '@mui/material';
import type { TransactionFilters } from '../../utils/filterParams';
import { formatAmountRange, formatDateRange } from '../../utils/format';

interface ActiveFilterChipsProps {
  filters: TransactionFilters;
  onChange: (changes: Partial<TransactionFilters>) => void;
  onClearAll: () => void;
}

interface FilterChip {
  key: string;
  label: string;
  remove: () => void;
}

/** Removes one value from a list filter, dropping the filter entirely when nothing is left. */
function without<T>(values: T[] | undefined, value: T): T[] | undefined {
  const rest = (values ?? []).filter((item) => item !== value);
  return rest.length > 0 ? rest : undefined;
}

/** Every applied filter as a removable chip, one per value, so any one can be undone in a click. */
export function ActiveFilterChips({ filters, onChange, onClearAll }: ActiveFilterChipsProps) {
  const chips: FilterChip[] = [];

  if (filters.search) {
    chips.push({
      key: 'search',
      label: `Search: “${filters.search}”`,
      remove: () => onChange({ search: undefined }),
    });
  }
  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      key: 'date',
      label: `Date: ${formatDateRange(filters.dateFrom, filters.dateTo)}`,
      remove: () => onChange({ dateFrom: undefined, dateTo: undefined }),
    });
  }
  if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
    chips.push({
      key: 'amount',
      label: `Amount: ${formatAmountRange(filters.amountMin, filters.amountMax)}`,
      remove: () => onChange({ amountMin: undefined, amountMax: undefined }),
    });
  }
  for (const category of filters.categories ?? []) {
    chips.push({
      key: `category:${category}`,
      label: `Category: ${category}`,
      remove: () => onChange({ categories: without(filters.categories, category) }),
    });
  }
  for (const status of filters.statuses ?? []) {
    chips.push({
      key: `status:${status}`,
      label: `Status: ${status}`,
      remove: () => onChange({ statuses: without(filters.statuses, status) }),
    });
  }
  for (const userId of filters.userIds ?? []) {
    chips.push({
      key: `user:${userId}`,
      label: `User: ${userId}`,
      remove: () => onChange({ userIds: without(filters.userIds, userId) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <Stack
      direction="row"
      aria-label="Active filters"
      sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
    >
      {chips.map((chip) => (
        <Chip key={chip.key} label={chip.label} size="small" onDelete={chip.remove} />
      ))}
      <Button size="small" onClick={onClearAll}>
        Clear all
      </Button>
    </Stack>
  );
}
