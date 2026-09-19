import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import mongoose from 'mongoose';
import { env } from '../../src/config/env.js';
import { connectDb, disconnectDb } from '../../src/db/connect.js';
import { normalizeEmail } from '../../src/models/user.model.js';
import { logger } from '../../src/utils/logger.js';
import { syncAllIndexes } from './indexes.js';
import { parseTransactionRows } from './parseRows.js';
import { formatReport } from './report.js';
import { upsertDemoUser } from './seedDemoUser.js';
import { loadDemoUserFromEnv } from './seedEnv.js';
import { deleteAllTransactions, upsertTransactions } from './seedTransactions.js';
import { findMismatches, summarizeTransactions } from './summary.js';

const DATA_FILE = new URL('../../data/transactions.json', import.meta.url);

/** Returns true when the seeded data matches the expected totals. */
async function seed(): Promise<boolean> {
  // Unknown flags throw, so a typo like --rest can't silently run a normal seed.
  const { values: flags } = parseArgs({ options: { reset: { type: 'boolean', default: false } } });
  const demoUser = loadDemoUserFromEnv();
  // Validate the whole file before connecting, so bad data never half-seeds the database.
  const rows = parseTransactionRows(JSON.parse(await readFile(DATA_FILE, 'utf8')) as unknown);

  await connectDb(env.MONGODB_URI);
  try {
    // Users are deliberately kept: a reset mid-development shouldn't invalidate the demo login.
    const removed = flags.reset ? await deleteAllTransactions() : null;
    // Indexes first, so the unique index on `id` is in place while upserting.
    const indexes = await syncAllIndexes();
    const upserts = await upsertTransactions(rows);
    const outcome = await upsertDemoUser(demoUser);
    const summary = await summarizeTransactions();
    const mismatches = findMismatches(summary);

    logger.info(
      formatReport({
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        removed,
        fileRows: rows.length,
        upserts,
        indexes,
        demoUser: { email: normalizeEmail(demoUser.email), outcome },
        summary,
        mismatches,
      }),
    );
    return mismatches.length === 0;
  } finally {
    await disconnectDb();
  }
}

seed()
  .then((matches) => {
    process.exitCode = matches ? 0 : 1;
  })
  .catch((error: unknown) => {
    logger.error(`Seed failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
