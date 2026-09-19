import { describe, expect, it } from 'vitest';
import { durationToSeconds } from '../../src/utils/duration.js';

describe('durationToSeconds', () => {
  it.each([
    ['30s', 30],
    ['15m', 900],
    ['8h', 28_800],
    ['1d', 86_400],
  ])('converts %s to %i seconds', (input, seconds) => {
    expect(durationToSeconds(input)).toBe(seconds);
  });

  it.each(['8', 'h', '1.5h', '8 hours', '-1h'])('rejects %s', (input) => {
    expect(() => durationToSeconds(input)).toThrow(/Invalid duration/);
  });
});
