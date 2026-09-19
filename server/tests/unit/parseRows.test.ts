import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseTransactionRows } from '../../scripts/seed/parseRows.js';

const validRow = {
  id: 1,
  date: '2024-01-15T08:34:12Z',
  amount: 1500,
  category: 'Revenue',
  status: 'Paid',
  user_id: 'user_001',
  user_profile: 'https://thispersondoesnotexist.com/',
};

describe('parseTransactionRows', () => {
  it('accepts the real data file and converts dates to Date objects', () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL('../../data/transactions.json', import.meta.url), 'utf8'),
    );

    const rows = parseTransactionRows(raw);

    expect(rows).toHaveLength(300);
    expect(rows[0]?.date).toEqual(new Date('2024-01-15T08:34:12Z'));
  });

  it('names the row and field of an invalid value', () => {
    const input = [validRow, { ...validRow, id: 2, category: 'Refund' }];

    expect(() => parseTransactionRows(input)).toThrow(/rows\[1\]\.category/);
  });

  it('rejects duplicate ids, which upserting would silently merge', () => {
    const input = [validRow, { ...validRow }];

    expect(() => parseTransactionRows(input)).toThrow('rows[1].id: duplicate id 1');
  });

  it('rejects dates that are not ISO 8601 datetimes', () => {
    const input = [{ ...validRow, date: '15/01/2024' }];

    expect(() => parseTransactionRows(input)).toThrow(/rows\[0\]\.date/);
  });
});
