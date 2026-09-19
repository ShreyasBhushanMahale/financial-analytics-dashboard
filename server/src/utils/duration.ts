/** A whole number followed by a unit: 30s, 15m, 8h, 1d. */
export const DURATION_PATTERN = /^(\d+)([smhd])$/;

const SECONDS_PER_UNIT: Record<string, number> = { s: 1, m: 60, h: 3_600, d: 86_400 };

export function durationToSeconds(value: string): number {
  const match = DURATION_PATTERN.exec(value);
  const unitSeconds = match?.[2] === undefined ? undefined : SECONDS_PER_UNIT[match[2]];
  if (!match || unitSeconds === undefined) {
    throw new Error(`Invalid duration "${value}": use a whole number followed by s, m, h or d`);
  }
  return Number(match[1]) * unitSeconds;
}
