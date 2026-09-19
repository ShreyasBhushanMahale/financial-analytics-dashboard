import { Box, Stack, Typography } from '@mui/material';
import { Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts';
import { useChartColors } from '../../hooks/useChartColors';
import type { Summary } from '../../types/api';
import { formatCount, formatMoney, formatPercent } from '../../utils/format';
import { ChartTooltipCard } from '../charts/ChartTooltipCard';

interface Slice {
  label: string;
  total: number;
  count: number;
  fill: string;
}

function SliceTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload[0]?.payload as Slice | undefined;
  if (!active || !slice) return null;
  return (
    <ChartTooltipCard
      title={slice.label}
      rows={[
        { label: 'Amount', value: formatMoney(slice.total), color: slice.fill },
        { label: 'Transactions', value: formatCount(slice.count) },
      ]}
    />
  );
}

/** How the money splits between revenue and expenses, with the share of each beside the ring. */
export function CategoryDonut({ byCategory }: { byCategory: Summary['byCategory'] }) {
  const colors = useChartColors();
  const slices: Slice[] = byCategory.map((entry) => ({
    label: entry.key === 'Revenue' ? 'Revenue' : 'Expenses',
    total: entry.total,
    count: entry.count,
    fill: entry.key === 'Revenue' ? colors.revenue : colors.expense,
  }));
  const volume = slices.reduce((sum, slice) => sum + slice.total, 0);
  const transactions = slices.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '200px 1fr' },
        gap: 3,
        alignItems: 'center',
      }}
    >
      <Box sx={{ position: 'relative', height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="label"
              innerRadius="68%"
              outerRadius="95%"
              paddingAngle={2}
              stroke="none"
            />
            <Tooltip content={SliceTooltip} />
          </PieChart>
        </ResponsiveContainer>
        {/* The ring's hole shows how many transactions it covers. */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography variant="h6">{formatCount(transactions)}</Typography>
            <Typography variant="caption" color="text.secondary">
              transactions
            </Typography>
          </Box>
        </Box>
      </Box>
      <Stack spacing={2}>
        {slices.map((slice) => (
          <Box key={slice.label}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: slice.fill }} />
              <Typography variant="body2" color="text.secondary">
                {slice.label} · {volume > 0 ? formatPercent(slice.total / volume) : '0%'}
              </Typography>
            </Stack>
            <Typography sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {formatMoney(slice.total)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatCount(slice.count)} transactions
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
