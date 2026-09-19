/**
 * Escapes every character with a special meaning in a regular expression, so user input like
 * ".*" matches literally instead of matching everything (or, worse, running a pathological pattern).
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
