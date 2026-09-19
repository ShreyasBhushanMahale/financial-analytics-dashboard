import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material';
import { useId } from 'react';
import type { ExportColumn, ExportColumnKey } from '../../types/api';

interface ColumnPickerProps {
  columns: ExportColumn[];
  selected: ExportColumnKey[];
  onChange: (selected: ExportColumnKey[]) => void;
}

export function ColumnPicker({ columns, selected, onChange }: ColumnPickerProps) {
  const labelId = useId();
  const allKeys = columns.map((column) => column.key);

  // Rebuilt from the full list so the file's column order never depends on click order.
  const toggle = (key: ExportColumnKey) =>
    onChange(
      selected.includes(key)
        ? selected.filter((item) => item !== key)
        : allKeys.filter((item) => item === key || selected.includes(item)),
    );

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
      >
        <Typography id={labelId} variant="subtitle2">
          Columns{' '}
          <Typography component="span" variant="caption" color="text.secondary">
            {selected.length} of {columns.length} selected
          </Typography>
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            onClick={() => onChange(allKeys)}
            disabled={selected.length === columns.length}
          >
            Select all
          </Button>
          <Button size="small" onClick={() => onChange([])} disabled={selected.length === 0}>
            None
          </Button>
        </Stack>
      </Stack>
      <Box
        role="group"
        aria-labelledby={labelId}
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2 }}
      >
        {columns.map((column) => (
          <FormControlLabel
            key={column.key}
            label={column.label}
            control={
              <Checkbox
                size="small"
                checked={selected.includes(column.key)}
                onChange={() => toggle(column.key)}
              />
            }
          />
        ))}
      </Box>
    </Box>
  );
}
