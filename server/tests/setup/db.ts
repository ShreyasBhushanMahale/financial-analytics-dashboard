import mongoose from 'mongoose';
import { env } from '../../src/config/env.js';
import { connectDb, disconnectDb } from '../../src/db/connect.js';

/**
 * Connects to the test database. Integration tests delete data, so any database
 * whose name doesn't end in "_test" is refused: a misconfigured URI can't wipe real data.
 */
export async function connectTestDb(): Promise<void> {
  await connectDb(env.MONGODB_URI);

  const { name } = mongoose.connection;
  if (!name.endsWith('_test')) {
    await disconnectDb();
    throw new Error(
      `Refusing to run tests against "${name}": the database name must end in "_test".`,
    );
  }
}

/** Drops the whole test database, so each integration file starts from nothing. */
export async function clearTestDb(): Promise<void> {
  await mongoose.connection.dropDatabase();
}
