import type { z } from 'zod';
import { describeIssues } from '../utils/zodIssues.js';

/** Validates environment variables, listing every problem at once instead of failing on the first. */
export function parseEnv<Schema extends z.ZodType>(
  schema: Schema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<Schema> {
  const result = schema.safeParse(source);
  if (!result.success) {
    const problems = describeIssues(result.error)
      .map(({ path, message }) => `  - ${path}: ${message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${problems}\nCopy server/.env.example to server/.env and fill it in.`,
    );
  }
  return result.data;
}
