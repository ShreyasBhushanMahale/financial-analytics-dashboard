import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import {
  Box,
  Button,
  Chip,
  FormHelperText,
  Popover,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState, type MouseEvent } from 'react';
import { buildDatePresets, type DatePreset } from '../../utils/datePresets';
import { formatDateRange } from '../../utils/format';

interface DateRange {
  dateFrom?: string;
  dateTo?: string;
}

interface DateRangeButtonProps extends DateRange {
  /** The span of the data, for building year and quarter presets. */
  bounds: { min: string; max: string } | null;
  onApply: (range: DateRange) => void;
}

/**
 * The design's calendar-and-range control. Native date inputs keep it light and accessible (no
 * date library, no paid picker). Presets come from the years the data actually covers.
 */
export function DateRangeButton({ dateFrom, dateTo, bounds, onApply }: DateRangeButtonProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const presets = useMemo(() => buildDatePresets(bounds), [bounds]);

  const isBackwards = from !== '' && to !== '' && from > to;

  const open = (event: MouseEvent<HTMLElement>) => {
    // Each opening starts from the range currently applied, not a half-edited draft.
    setFrom(dateFrom ?? '');
    setTo(dateTo ?? '');
    setAnchor(event.currentTarget);
  };

  const apply = (range: DateRange) => {
    onApply({ dateFrom: range.dateFrom || undefined, dateTo: range.dateTo || undefined });
    setAnchor(null);
  };

  const isActive = (preset: DatePreset) => preset.dateFrom === dateFrom && preset.dateTo === dateTo;

  return (
    <>
      <Button
        color="inherit"
        startIcon={<CalendarMonthOutlined />}
        onClick={open}
        aria-haspopup="dialog"
        sx={{ fontWeight: 500, color: 'text.secondary', whiteSpace: 'nowrap' }}
      >
        {formatDateRange(dateFrom, dateTo)}
      </Button>
      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 340 }} role="dialog" aria-label="Date range">
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Date range{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              (UTC)
            </Typography>
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {presets.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                size="small"
                color={isActive(preset) ? 'primary' : 'default'}
                variant={isActive(preset) ? 'filled' : 'outlined'}
                onClick={() => apply(preset)}
              />
            ))}
          </Box>
          <Stack direction="row" spacing={1.5}>
            <TextField
              type="date"
              label="From"
              size="small"
              fullWidth
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="date"
              label="To"
              size="small"
              fullWidth
              value={to}
              onChange={(event) => setTo(event.target.value)}
              error={isBackwards}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
          {isBackwards && (
            <FormHelperText error>
              &ldquo;To&rdquo; must be on or after &ldquo;From&rdquo;.
            </FormHelperText>
          )}
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={() => apply({})}>Clear</Button>
            <Button
              variant="contained"
              disabled={isBackwards}
              onClick={() => apply({ dateFrom: from, dateTo: to })}
            >
              Apply
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
