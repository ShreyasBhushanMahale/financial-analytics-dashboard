import NorthEastRounded from '@mui/icons-material/NorthEastRounded';
import SouthWestRounded from '@mui/icons-material/SouthWestRounded';
import { Chip } from '@mui/material';
import type { Category } from '../../types/api';

/**
 * Neutral chip with a coloured arrow: money in (green, up) or out (yellow, down). The chip itself
 * stays grey so it isn't confused with the coloured status pill beside it.
 */
export function CategoryChip({ category }: { category: Category }) {
  const isRevenue = category === 'Revenue';
  const Arrow = isRevenue ? NorthEastRounded : SouthWestRounded;
  return (
    <Chip
      size="small"
      variant="outlined"
      label={category}
      icon={
        <Arrow
          fontSize="small"
          sx={{ '&&': { color: isRevenue ? 'success.main' : 'warning.main' } }}
        />
      }
    />
  );
}
