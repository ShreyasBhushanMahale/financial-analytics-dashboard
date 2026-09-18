// Tests deliberately trigger errors; logging them would bury the test report in noise.
const silent = process.env.NODE_ENV === 'test';

export const logger = {
  info(message: string, ...meta: unknown[]): void {
    if (!silent) console.log(message, ...meta);
  },
  error(message: string, ...meta: unknown[]): void {
    if (!silent) console.error(message, ...meta);
  },
};
