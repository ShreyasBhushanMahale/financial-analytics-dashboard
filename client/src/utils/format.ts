import { CURRENCY, LOCALE } from '../config/locale';
import type { Category } from '../types/api';

// Formatters are built once: constructing Intl objects on every render is surprisingly costly.
const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
const compactMoney = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
});
const count = new Intl.NumberFormat(LOCALE);
const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 0 });

// Every date is shown in UTC, matching how the server filters and groups by day and month.
const day = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const weekdayDay = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});
const month = new Intl.DateTimeFormat(LOCALE, { month: 'short', timeZone: 'UTC' });
const monthYear = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** $339,803.25 */
export function formatMoney(value: number): string {
  return money.format(value);
}

/** $340K: for chart axes, where space is short. */
export function formatCompactMoney(value: number): string {
  return compactMoney.format(value);
}

/** +$1,500.00 for revenue, −$1,500.00 for expenses (amounts are stored unsigned). */
export function formatSignedAmount(amount: number, category: Category): string {
  return `${category === 'Revenue' ? '+' : '−'}${money.format(amount)}`;
}

export function formatCount(value: number): string {
  return count.format(value);
}

/** 0.62 -> 62% */
export function formatPercent(ratio: number): string {
  return percent.format(ratio);
}

/** Dec 23, 2024 */
export function formatDay(iso: string): string {
  return day.format(new Date(iso));
}

/** Mon, Dec 23, 2024: the table's date column, as in the design. */
export function formatDayWithWeekday(iso: string): string {
  return weekdayDay.format(new Date(iso));
}

/** Dec 23, 2024, 5:05 PM UTC: the exact moment, for a tooltip. */
export function formatDateTimeUtc(iso: string): string {
  return `${dateTime.format(new Date(iso))} UTC`;
}

/**
 * A YYYY-MM-DD range for labels: "Jan 1, 2024 – Mar 31, 2024", "From Jan 1, 2024",
 * "Until Mar 31, 2024" or "All time".
 */
export function formatDateRange(from?: string, to?: string): string {
  if (from && to) return from === to ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
  if (from) return `From ${formatDay(from)}`;
  if (to) return `Until ${formatDay(to)}`;
  return 'All time';
}

/** "$100 – $2,000", "≥ $100" or "≤ $2,000". */
export function formatAmountRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${formatMoney(min)} – ${formatMoney(max)}`;
  if (min !== undefined) return `≥ ${formatMoney(min)}`;
  if (max !== undefined) return `≤ ${formatMoney(max)}`;
  return 'Any amount';
}

/** Jan */
export function formatMonth(iso: string): string {
  return month.format(new Date(iso));
}

/** Jan 2024 */
export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}
