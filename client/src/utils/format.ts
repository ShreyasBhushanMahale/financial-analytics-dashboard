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

/** Jan */
export function formatMonth(iso: string): string {
  return month.format(new Date(iso));
}

/** Jan 2024 */
export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}
