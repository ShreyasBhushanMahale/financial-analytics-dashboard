import { alpha, useTheme } from '@mui/material/styles';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { useChartColors } from '../../hooks/useChartColors';
import type { Summary } from '../../types/api';
import { formatCompactMoney, formatCount, formatMoney } from '../../utils/format';
import { ChartTooltipCard } from '../charts/ChartTooltipCard';

type StatusRow = Summary['byStatus'][number];

function StatusTooltip({ active, payload }: TooltipContentProps) {
  const row = payload[0]?.payload as StatusRow | undefined;
  if (!active || !row) return null;
  return (
    <ChartTooltipCard
      title={`${row.key} · ${formatCount(row.count)} transactions`}
      rows={[
        { label: 'Revenue', value: formatMoney(row.revenue), color: payload[0]?.color },
        { label: 'Expenses', value: formatMoney(row.expense), color: payload[1]?.color },
      ]}
    />
  );
}

/**
 * Paid against Pending, each bar split into revenue and expenses. That answers "how much money
 * is still outstanding, and in which direction", not just "how many rows are pending".
 */
export function StatusSplitChart({ byStatus }: { byStatus: Summary['byStatus'] }) {
  const colors = useChartColors();
  const theme = useTheme();
  const tick = { fill: colors.axis, fontSize: 12 };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={byStatus}
        layout="vertical"
        margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid horizontal={false} stroke={colors.grid} strokeDasharray="4 4" />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatCompactMoney(value)}
          tick={tick}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="key"
          tick={{ ...tick, fill: theme.palette.text.primary }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip
          content={StatusTooltip}
          cursor={{ fill: alpha(theme.palette.text.primary, 0.04) }}
        />
        <Bar dataKey="revenue" name="Revenue" stackId="amount" fill={colors.revenue} barSize={28} />
        <Bar
          dataKey="expense"
          name="Expenses"
          stackId="amount"
          fill={colors.expense}
          barSize={28}
          radius={[0, 6, 6, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
