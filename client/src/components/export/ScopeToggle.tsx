import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import { useId } from 'react';
import { formatCount } from '../../utils/format';

export type ExportScope = 'current' | 'all';

interface ScopeToggleProps {
  value: ExportScope;
  onChange: (scope: ExportScope) => void;
  hasFilters: boolean;
  /** Row counts per scope; undefined while they load. */
  currentCount: number | undefined;
  allCount: number | undefined;
}

const count = (value: number | undefined) => (value === undefined ? '…' : formatCount(value));

export function ScopeToggle({
  value,
  onChange,
  hasFilters,
  currentCount,
  allCount,
}: ScopeToggleProps) {
  const labelId = useId();

  return (
    <FormControl>
      <FormLabel id={labelId} sx={{ typography: 'subtitle2', color: 'text.primary', mb: 0.5 }}>
        Rows
      </FormLabel>
      <RadioGroup
        aria-labelledby={labelId}
        value={value}
        onChange={(event) => onChange(event.target.value as ExportScope)}
      >
        <FormControlLabel
          value="current"
          control={<Radio size="small" />}
          disabled={!hasFilters}
          label={
            hasFilters
              ? `Current filters (${count(currentCount)} rows)`
              : 'Current filters (none applied)'
          }
        />
        <FormControlLabel
          value="all"
          control={<Radio size="small" />}
          label={`All transactions (${count(allCount)})`}
        />
      </RadioGroup>
    </FormControl>
  );
}
