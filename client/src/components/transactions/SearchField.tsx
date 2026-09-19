import CloseRounded from '@mui/icons-material/CloseRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import { useCallback, useRef } from 'react';
import { useDebouncedInput } from '../../hooks/useDebouncedInput';
import { useSlashToFocus } from '../../hooks/useSlashToFocus';

const SEARCH_DELAY_MS = 300;
const trim = (value: string) => value.trim();

interface SearchFieldProps {
  value: string;
  onCommit: (search: string | undefined) => void;
}

/** Searches as you type, 300 ms after the last keystroke. "/" focuses it and Escape clears it. */
export function SearchField({ value, onCommit }: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useSlashToFocus(inputRef);

  const commit = useCallback((raw: string) => onCommit(raw.trim() || undefined), [onCommit]);
  const { draft, change, commitNow } = useDebouncedInput(value, commit, SEARCH_DELAY_MS, trim);

  return (
    <TextField
      size="small"
      value={draft}
      onChange={(event) => change(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') commitNow('');
        if (event.key === 'Enter') commitNow(draft);
      }}
      // Says exactly what matches: dates aren't searchable, and numbers match whole values only.
      placeholder="Search user, category, status or exact ID/amount"
      inputRef={inputRef}
      sx={{ width: { xs: '100%', sm: 400 }, '& input::placeholder': { fontSize: 14 } }}
      slotProps={{
        htmlInput: { 'aria-label': 'Search transactions by user, category, status, ID or amount' },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: draft ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                aria-label="Clear search"
                onClick={() => commitNow('')}
              >
                <CloseRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : (
            <InputAdornment position="end">
              <Box
                component="kbd"
                title='Press "/" to search'
                sx={{
                  px: 0.75,
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontSize: 12,
                  fontFamily: 'inherit',
                }}
              >
                /
              </Box>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
