export const CATEGORIES = ['Revenue', 'Expense'] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ['Paid', 'Pending'] as const;
export type Status = (typeof STATUSES)[number];

/** The only fields a client may sort by; anything else is rejected with a 400. */
export const SORTABLE_FIELDS = ['id', 'date', 'amount', 'category', 'status', 'user_id'] as const;
export type SortField = (typeof SORTABLE_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

/** The only fields a CSV export may include, in their default order. */
export const EXPORT_COLUMNS = [
  'id',
  'date',
  'amount',
  'category',
  'status',
  'user_id',
  'user_profile',
] as const;
export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

/** CSV header text for each column. */
export const EXPORT_COLUMN_LABELS: Record<ExportColumn, string> = {
  id: 'ID',
  date: 'Date (UTC)',
  amount: 'Amount',
  category: 'Category',
  status: 'Status',
  user_id: 'User ID',
  user_profile: 'User Profile',
};
