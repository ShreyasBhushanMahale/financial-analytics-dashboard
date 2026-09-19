// Mirrors the server's response shapes (see docs/API.md). Kept by hand rather than shared through a
// package: a handful of stable types don't justify a third workspace.

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const CATEGORIES = ['Revenue', 'Expense'] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ['Paid', 'Pending'] as const;
export type Status = (typeof STATUSES)[number];

/** Mirrors the server's sort whitelist. */
export const SORT_FIELDS = ['id', 'date', 'amount', 'category', 'status', 'user_id'] as const;
export type SortField = (typeof SORT_FIELDS)[number];
export type SortOrder = 'asc' | 'desc';

export interface Transaction {
  id: number;
  /** ISO 8601, UTC. */
  date: string;
  /** Always positive; `category` decides the sign. */
  amount: number;
  category: Category;
  status: Status;
  user_id: string;
  user_profile: string;
}

/** The server's export whitelist is exactly the transaction's own fields. */
export type ExportColumnKey = keyof Transaction;

export interface ExportColumn {
  key: ExportColumnKey;
  /** The CSV header text for this column. */
  label: string;
}

export interface TransactionPage {
  data: Transaction[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface FilterOptions {
  categories: Category[];
  statuses: Status[];
  userIds: string[];
  /** null only when there are no transactions at all. */
  dateRange: { min: string; max: string } | null;
  amountRange: { min: number; max: number } | null;
}

export interface Summary {
  totals: {
    revenue: number;
    expense: number;
    net: number;
    pending: number;
    pendingCount: number;
    count: number;
  };
  byCategory: { key: Category; total: number; count: number }[];
  byStatus: { key: Status; revenue: number; expense: number; count: number }[];
}

export interface TrendPoint {
  /** First instant of the UTC month, ISO 8601. */
  period: string;
  revenue: number;
  expense: number;
}
