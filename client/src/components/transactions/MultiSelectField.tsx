import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { useId } from 'react';

interface MultiSelectFieldProps<T extends string> {
  label: string;
  options: readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

/** A checkbox dropdown. Nothing selected means "no restriction", shown as "All". */
export function MultiSelectField<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFieldProps<T>) {
  const labelId = useId();

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={labelId} shrink>
        {label}
      </InputLabel>
      <Select<T[]>
        labelId={labelId}
        label={label}
        multiple
        displayEmpty
        notched
        value={selected}
        onChange={(event) => {
          const { value } = event.target;
          // MUI hands back a comma-joined string when the browser autofills the field.
          onChange((typeof value === 'string' ? value.split(',') : value) as T[]);
        }}
        renderValue={(values) =>
          values.length === 0 ? (
            <Typography component="span" color="text.secondary">
              All
            </Typography>
          ) : (
            values.join(', ')
          )
        }
      >
        {options.map((option) => (
          <MenuItem key={option} value={option} dense>
            <Checkbox size="small" checked={selected.includes(option)} sx={{ py: 0 }} />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
