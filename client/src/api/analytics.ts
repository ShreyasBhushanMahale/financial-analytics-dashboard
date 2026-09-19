import type { Summary, TrendPoint } from '../types/api';
import { filtersToParams, type TransactionFilters } from '../utils/filterParams';
import { http } from './http';

export async function fetchSummary(filters: TransactionFilters): Promise<Summary> {
  const { data } = await http.get<Summary>('/analytics/summary', {
    params: filtersToParams(filters),
  });
  return data;
}

export async function fetchMonthlyTrend(filters: TransactionFilters): Promise<TrendPoint[]> {
  const { data } = await http.get<{ points: TrendPoint[] }>('/analytics/trend', {
    params: filtersToParams(filters),
  });
  return data.points;
}
