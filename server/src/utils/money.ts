/** Rounds to cents. Summing floats drifts (339803.25 can come out as 339803.25000000006). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
