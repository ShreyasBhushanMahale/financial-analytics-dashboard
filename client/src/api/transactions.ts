import type { FilterOptions, SortField, SortOrder, TransactionPage } from '../types/api';
import { filtersToParams, type TransactionFilters } from '../utils/filterParams';
import { http } from './http';

export interface TransactionListQuery {
  filters: TransactionFilters;
  page: number;
  pageSize: number;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export async function fetchTransactions(query: TransactionListQuery): Promise<TransactionPage> {
  const params = filtersToParams(query.filters);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  params.set('sortBy', query.sortBy);
  params.set('sortOrder', query.sortOrder);

  const { data } = await http.get<TransactionPage>('/transactions', { params });
  return data;
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data } = await http.get<FilterOptions>('/transactions/filter-options');
  return data;
}
