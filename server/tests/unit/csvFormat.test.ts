import { Readable } from 'node:stream';
import { text } from 'node:stream/consumers';
import { describe, expect, it } from 'vitest';
import type { ExportColumn } from '../../src/constants/transaction.js';
import type { Transaction } from '../../src/models/transaction.model.js';
import { createCsvStringifier, escapeFormula, toCsvRecord } from '../../src/services/csvFormat.js';

const transaction: Transaction = {
  id: 7,
  date: new Date('2024-07-14T09:45:33Z'),
  amount: 900,
  category: 'Revenue',
  status: 'Pending',
  user_id: 'user_003',
  user_profile: 'https://thispersondoesnotexist.com/',
};

/** Runs records through the stringifier and returns the CSV text it produces. */
function renderCsv(columns: ExportColumn[], records: object[]): Promise<string> {
  return text(Readable.from(records).pipe(createCsvStringifier(columns)));
}

describe('escapeFormula', () => {
  it.each(['=SUM(A1:A9)', '+1', '-1', '@cmd', '\tX', '\rX'])(
    'prefixes %j with an apostrophe so it is shown as text',
    (value) => {
      expect(escapeFormula(value)).toBe(`'${value}`);
    },
  );

  it.each(['Revenue', 'user_001', 'https://thispersondoesnotexist.com/', '', 'a=b'])(
    'leaves %j unchanged',
    (value) => {
      expect(escapeFormula(value)).toBe(value);
    },
  );
});

describe('toCsvRecord', () => {
  it('formats every column as spreadsheet-friendly text', () => {
    expect(
      toCsvRecord(transaction, [
        'id',
        'date',
        'amount',
        'category',
        'status',
        'user_id',
        'user_profile',
      ]),
    ).toEqual({
      id: '7',
      date: '2024-07-14T09:45:33.000Z',
      amount: '900.00',
      category: 'Revenue',
      status: 'Pending',
      user_id: 'user_003',
      user_profile: 'https://thispersondoesnotexist.com/',
    });
  });

  it('includes only the requested columns', () => {
    expect(Object.keys(toCsvRecord(transaction, ['amount', 'id']))).toEqual(['amount', 'id']);
  });

  it('always writes amounts with two decimals', () => {
    expect(toCsvRecord({ ...transaction, amount: 1200.5 }, ['amount'])).toEqual({
      amount: '1200.50',
    });
  });

  it('escapes formula characters in text fields', () => {
    expect(toCsvRecord({ ...transaction, user_id: '=cmd()' }, ['user_id'])).toEqual({
      user_id: "'=cmd()",
    });
  });
});

describe('createCsvStringifier', () => {
  it('writes a header of labels in the requested order, then one line per record', async () => {
    const columns: ExportColumn[] = ['status', 'amount', 'id', 'date'];

    const csv = await renderCsv(columns, [toCsvRecord(transaction, columns)]);

    expect(csv).toBe('Status,Amount,ID,Date (UTC)\nPending,900.00,7,2024-07-14T09:45:33.000Z\n');
  });

  it('quotes values containing commas, quotes or line breaks', async () => {
    const csv = await renderCsv(['user_id'], [{ user_id: 'a,"b"\nc' }]);

    expect(csv).toBe('User ID\n"a,""b""\nc"\n');
  });

  it('still writes the header when no rows match', async () => {
    expect(await renderCsv(['id', 'amount'], [])).toBe('ID,Amount\n');
  });
});
