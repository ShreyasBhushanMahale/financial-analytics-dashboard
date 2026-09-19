import TuneRounded from '@mui/icons-material/TuneRounded';
import { Badge, Box, Button, Popover, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { FilterOptions } from '../../types/api';
import type { TransactionFilters } from '../../utils/filterParams';
import { AmountInput } from './AmountInput';
import { MultiSelectField } from './MultiSelectField';

interface FiltersButtonProps {
  filters: TransactionFilters;
  options: FilterOptions | undefined;
  onChange: (changes: Partial<TransactionFilters>) => void;
}

const nonEmpty = <T,>(values: T[]) => (values.length > 0 ? values : undefined);

/**
 * The filters that don't fit in the header: amount, category, status and user. Changes apply as
 * they're made (amounts after a short pause), so the table below updates live.
 */
export function FiltersButton({ filters, options, onChange }: FiltersButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const appliedCount = [
    filters.amountMin !== undefined || filters.amountMax !== undefined,
    Boolean(filters.categories?.length),
    Boolean(filters.statuses?.length),
    Boolean(filters.userIds?.length),
  ].filter(Boolean).length;

  const amountRange = options?.amountRange;

  return (
    <>
      <Badge badgeContent={appliedCount} color="primary">
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<TuneRounded />}
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-haspopup="dialog"
          sx={{ borderColor: 'divider' }}
        >
          Filters
        </Button>
      </Badge>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 340 }} role="dialog" aria-label="Filters">
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Amount
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <AmountInput
                  label="Min"
                  bound="min"
                  value={filters.amountMin}
                  otherValue={filters.amountMax}
                  placeholder={amountRange ? String(amountRange.min) : undefined}
                  onCommit={(amountMin) => onChange({ amountMin })}
                />
                <AmountInput
                  label="Max"
                  bound="max"
                  value={filters.amountMax}
                  otherValue={filters.amountMin}
                  placeholder={amountRange ? String(amountRange.max) : undefined}
                  onCommit={(amountMax) => onChange({ amountMax })}
                />
              </Stack>
            </Box>
            <MultiSelectField
              label="Category"
              options={options?.categories ?? []}
              selected={filters.categories ?? []}
              onChange={(categories) => onChange({ categories: nonEmpty(categories) })}
            />
            <MultiSelectField
              label="Status"
              options={options?.statuses ?? []}
              selected={filters.statuses ?? []}
              onChange={(statuses) => onChange({ statuses: nonEmpty(statuses) })}
            />
            <MultiSelectField
              label="User"
              options={options?.userIds ?? []}
              selected={filters.userIds ?? []}
              onChange={(userIds) => onChange({ userIds: nonEmpty(userIds) })}
            />
            <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
              <Button
                disabled={appliedCount === 0}
                onClick={() =>
                  onChange({
                    amountMin: undefined,
                    amountMax: undefined,
                    categories: undefined,
                    statuses: undefined,
                    userIds: undefined,
                  })
                }
              >
                Reset
              </Button>
              <Button variant="contained" onClick={() => setAnchor(null)}>
                Done
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
