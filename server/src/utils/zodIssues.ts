import type { ZodError } from 'zod';

export interface IssueDetail {
  path: string;
  message: string;
}

/** Flattens zod issues into `{ path, message }` pairs, with readable paths like `filters.categories[0]`. */
export function describeIssues(error: ZodError): IssueDetail[] {
  return error.issues.map((issue) => ({ path: formatPath(issue.path), message: issue.message }));
}

function formatPath(path: readonly PropertyKey[]): string {
  return path.reduce<string>((acc, key) => {
    if (typeof key === 'number') return `${acc}[${key}]`;
    return acc ? `${acc}.${String(key)}` : String(key);
  }, '');
}
