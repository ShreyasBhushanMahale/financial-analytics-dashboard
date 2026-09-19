import type { DemoUserOutcome } from './seedDemoUser.js';
import type { UpsertCounts } from './seedTransactions.js';
import type { IndexCounts } from './indexes.js';
import type { SeedSummary } from './summary.js';
import { formatAmount, formatUtcDay } from './format.js';

export interface SeedReport {
  database: string;
  host: string;
  /** Rows deleted by --reset, or null when it wasn't passed. */
  removed: number | null;
  fileRows: number;
  upserts: UpsertCounts;
  indexes: IndexCounts;
  demoUser: { email: string; outcome: DemoUserOutcome };
  summary: SeedSummary;
  mismatches: string[];
}

// Plain ASCII on purpose: older Windows consoles garble arrows and check marks.
export function formatReport(report: SeedReport): string {
  const { upserts, indexes, summary } = report;
  const dateRange =
    summary.firstDate && summary.lastDate
      ? `${formatUtcDay(summary.firstDate)} to ${formatUtcDay(summary.lastDate)} (UTC)`
      : 'none';

  const lines = [
    `Ledgerline seed: database "${report.database}" on ${report.host}`,
    report.removed === null
      ? 'Mode: upsert (pass --reset to wipe transactions first)'
      : `Mode: reset (deleted ${report.removed} transactions before seeding; users kept)`,
    '',
    `Transactions  ${report.fileRows} in file: ${upserts.inserted} inserted, ${upserts.updated} updated, ${upserts.unchanged} unchanged`,
    `Indexes       ${indexes.transactions} on transactions, ${indexes.users} on users (in sync)`,
    `Demo user     ${report.demoUser.email}: ${report.demoUser.outcome}`,
    '',
    'Summary',
    `  Rows        ${summary.count}`,
    `  Date range  ${dateRange}`,
    `  Revenue     ${formatAmount(summary.revenue)}`,
    `  Expense     ${formatAmount(summary.expense)}`,
    `  Pending     ${formatAmount(summary.pendingTotal)} (${summary.pendingCount} rows)`,
    '',
  ];

  if (report.mismatches.length === 0) {
    lines.push('OK: all totals match the expected values.');
  } else {
    lines.push('MISMATCH: the data does not match transactions.json');
    lines.push(...report.mismatches.map((mismatch) => `  - ${mismatch}`));
    lines.push('If the collection has rows that are not in the file, run: npm run seed -- --reset');
  }
  return lines.join('\n');
}
