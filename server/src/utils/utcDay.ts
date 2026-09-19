// Every date in the app is treated as UTC, so a transaction at 23:30Z never lands on a different
// day in the filter than it shows in the table.

/** Midnight UTC at the start of a YYYY-MM-DD day. */
export function startOfUtcDay(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

/** Midnight UTC after a YYYY-MM-DD day: an exclusive upper bound that includes the whole day. */
export function startOfNextUtcDay(day: string): Date {
  const next = startOfUtcDay(day);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
