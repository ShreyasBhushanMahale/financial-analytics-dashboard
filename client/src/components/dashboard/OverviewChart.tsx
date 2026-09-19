import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { useChartColors } from '../../hooks/useChartColors';
import type { TrendPoint } from '../../types/api';
import { formatCompactMoney, formatMoney, formatMonth, formatMonthYear } from '../../utils/format';
import { ChartTooltipCard } from '../charts/ChartTooltipCard';

function TrendTooltip({ active, payload }: TooltipContentProps) {
  const point = payload[0]?.payload as TrendPoint | undefined;
  if (!active || !point) return null;
  return (
    <ChartTooltipCard
      title={formatMonthYear(point.period)}
      rows={[
        { label: 'Revenue', value: formatMoney(point.revenue), color: payload[0]?.color },
        { label: 'Expenses', value: formatMoney(point.expense), color: payload[1]?.color },
        { label: 'Net', value: formatMoney(point.revenue - point.expense) },
      ]}
    />
  );
}

interface OverviewChartProps {
  points: TrendPoint[];
  height?: number;
}

/** Monthly revenue (green) against expenses (yellow), as smooth lines like the design. */
export function OverviewChart({ points, height = 280 }: OverviewChartProps) {
  const colors = useChartColors();
  // Month names alone are ambiguous once the range spans more than one year.
  const spansYears = new Set(points.map((point) => point.period.slice(0, 4))).size > 1;
  const tick = { fill: colors.axis, fontSize: 12 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="4 4" />
        <XAxis
          dataKey="period"
          tickFormatter={(period: string) =>
            spansYears ? formatMonthYear(period) : formatMonth(period)
          }
          tick={tick}
          tickLine={false}
          axisLine={false}
          dy={8}
        />
        <YAxis
          tickFormatter={(value: number) => formatCompactMoney(value)}
          tick={tick}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={TrendTooltip} cursor={{ stroke: colors.axis, strokeDasharray: '4 4' }} />
        {(['revenue', 'expense'] as const).map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key === 'revenue' ? 'Revenue' : 'Expenses'}
            stroke={colors[key]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: colors.surface }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
