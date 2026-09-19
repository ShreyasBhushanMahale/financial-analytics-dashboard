import { describe, expect, it } from 'vitest';
import { escapeRegex } from '../../src/utils/escapeRegex.js';

describe('escapeRegex', () => {
  it('escapes every special character, so the pattern matches the input exactly', () => {
    const special = '.*+?^${}()|[]\\';

    expect(new RegExp(`^${escapeRegex(special)}$`).test(special)).toBe(true);
  });

  it('leaves ordinary text unchanged', () => {
    expect(escapeRegex('user_001 Paid')).toBe('user_001 Paid');
  });
});
