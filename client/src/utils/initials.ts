/**
 * Two-character initials for an avatar: "Demo Analyst" -> "DA", and "user_003" -> "U3" (a
 * trailing number is kept whole, without leading zeros, so user_001 and user_010 stay distinct).
 */
export function initials(name: string): string {
  const words = name.split(/[\s_.-]+/).filter(Boolean);
  const [first, ...rest] = words;
  if (!first) return '?';

  const last = rest.at(-1);
  if (!last) return first.slice(0, 2).toUpperCase();

  const lastPart = /^\d+$/.test(last) ? String(Number(last)) : last.charAt(0);
  return `${first.charAt(0)}${lastPart}`.toUpperCase();
}
