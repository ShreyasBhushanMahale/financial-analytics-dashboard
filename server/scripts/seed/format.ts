const amountFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 339803.25 -> "339,803.25" */
export function formatAmount(value: number): string {
  return amountFormat.format(value);
}

/** The UTC calendar day, matching how the app filters and groups dates. */
export function formatUtcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}
