import { MongoMemoryServer } from 'mongodb-memory-server-core';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

// One throwaway mongod for the whole run: tests never need Atlas or a local install.
// The "-core" package has no install hook, so the MongoDB binary is downloaded here,
// on the first test run, rather than during everyone's `npm install`.
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const mongo = await MongoMemoryServer.create();
  project.provide('mongoUri', mongo.getUri('finance_dashboard_test'));

  return async () => {
    await mongo.stop();
  };
}
