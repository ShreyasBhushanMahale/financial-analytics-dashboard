import { InputAdornment, TextField } from '@mui/material';
import { useCallback } from 'react';
import { useDebouncedInput } from '../../hooks/useDebouncedInput';

const AMOUNT_DELAY_MS = 400;

/** '' is "no bound"; anything that isn't a number of 0 or more is invalid. */
function parseAmount(raw: string): number | undefined | 'invalid' {
  if (raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : 'invalid';
}

// "100.50" and "100.5" are the same amount, so neither should overwrite the other mid-typing.
const normalize = (raw: string) => {
  const parsed = parseAmount(raw);
  return typeof parsed === 'number' ? String(parsed) : raw.trim();
};

interface AmountInputProps {
  label: string;
  bound: 'min' | 'max';
  value: number | undefined;
  /** The other end of the range, to catch min > max before it reaches the API. */
  otherValue: number | undefined;
  placeholder?: string;
  onCommit: (value: number | undefined) => void;
}

export function AmountInput({
  label,
  bound,
  value,
  otherValue,
  placeholder,
  onCommit,
}: AmountInputProps) {
  const crossesOther = useCallback(
    (amount: number | undefined) =>
      amount !== undefined &&
      otherValue !== undefined &&
      (bound === 'min' ? amount > otherValue : amount < otherValue),
    [bound, otherValue],
  );

  const commit = useCallback(
    (raw: string) => {
      const parsed = parseAmount(raw);
      // Invalid input stays on screen with an error and is never sent.
      if (parsed === 'invalid' || crossesOther(parsed)) return;
      onCommit(parsed);
    },
    [crossesOther, onCommit],
  );

  const { draft, change } = useDebouncedInput(
    value === undefined ? '' : String(value),
    commit,
    AMOUNT_DELAY_MS,
    normalize,
  );

  const parsed = parseAmount(draft);
  const error =
    parsed === 'invalid'
      ? 'Enter 0 or more'
      : crossesOther(parsed)
        ? bound === 'min'
          ? 'Above the maximum'
          : 'Below the minimum'
        : undefined;

  return (
    <TextField
      label={label}
      size="small"
      type="number"
      value={draft}
      onChange={(event) => change(event.target.value)}
      error={error !== undefined}
      helperText={error}
      placeholder={placeholder}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { min: 0, step: 'any', inputMode: 'decimal' },
        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
      }}
    />
  );
}
