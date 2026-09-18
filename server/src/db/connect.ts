import mongoose from 'mongoose';

export async function connectDb(uri: string): Promise<void> {
  // A wrong URI or a missing Atlas IP allowlist entry should fail in seconds, not after the 30s default.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}
