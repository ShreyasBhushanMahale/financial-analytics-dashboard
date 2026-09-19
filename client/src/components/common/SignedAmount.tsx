import { Typography } from '@mui/material';
import type { Category } from '../../types/api';
import { formatSignedAmount } from '../../utils/format';

/** +$1,500.00 in green for revenue, −$1,500.00 in yellow for an expense, as in the design. */
export function SignedAmount({ amount, category }: { amount: number; category: Category }) {
  return (
    <Typography
      component="span"
      sx={{
        fontWeight: 600,
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        color: category === 'Revenue' ? 'success.main' : 'warning.main',
      }}
    >
      {formatSignedAmount(amount, category)}
    </Typography>
  );
}
