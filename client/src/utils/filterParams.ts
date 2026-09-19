import { CATEGORIES, STATUSES, type Category, type Status } from '../types/api';

/**
 * The filters, with the same names the API uses as query parameters. The browser URL and the API
 * request are therefore the same string, which keeps "what's in the address bar" and "what was
 * asked for" from ever drifting apart.
 */
export interface TransactionFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  categories?: Category[];
  statuses?: Status[];
  userIds?: string[];
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function list(params: URLSearchParams, key: string): string[] {
  return (params.get(key) ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function oneOf<T extends string>(allowed: readonly T[], values: string[]): T[] {
  return values.filter((value): value is T => (allowed as readonly string[]).includes(value));
}

function amount(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function day(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key);
  return value && ISO_DAY.test(value) ? value : undefined;
}

/**
 * Reads filters from a URL. Deliberately forgiving: a hand-edited or outdated link drops the
 * values it can't use instead of breaking the page. The server still validates everything.
 */
export function parseFilters(params: URLSearchParams): TransactionFilters {
  const filters: TransactionFilters = {};
  const search = params.get('search')?.trim();
  if (search) filters.search = search;

  const dateFrom = day(params, 'dateFrom');
  const dateTo = day(params, 'dateTo');
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  const amountMin = amount(params, 'amountMin');
  const amountMax = amount(params, 'amountMax');
  if (amountMin !== undefined) filters.amountMin = amountMin;
  if (amountMax !== undefined) filters.amountMax = amountMax;

  const categories = oneOf(CATEGORIES, list(params, 'categories'));
  const statuses = oneOf(STATUSES, list(params, 'statuses'));
  const userIds = list(params, 'userIds');
  if (categories.length) filters.categories = categories;
  if (statuses.length) filters.statuses = statuses;
  if (userIds.length) filters.userIds = userIds;

  return filters;
}

/** Writes filters as query parameters, skipping anything unset. Lists are comma-separated. */
export function filtersToParams(filters: TransactionFilters): URLSearchParams {
  const entries: [string, string | number | readonly string[] | undefined][] = [
    ['search', filters.search],
    ['dateFrom', filters.dateFrom],
    ['dateTo', filters.dateTo],
    ['amountMin', filters.amountMin],
    ['amountMax', filters.amountMax],
    ['categories', filters.categories],
    ['statuses', filters.statuses],
    ['userIds', filters.userIds],
  ];

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value === undefined || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number') {
      params.set(key, String(value));
    } else if (value.length > 0) {
      params.set(key, value.join(','));
    }
  }
  return params;
}

/** How many separate filters are applied (a list with three users counts once). */
export function countActiveFilters(filters: TransactionFilters): number {
  return Object.values(filters).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '',
  ).length;
}
