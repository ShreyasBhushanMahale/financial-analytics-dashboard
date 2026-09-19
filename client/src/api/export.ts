import type { ExportColumn, ExportColumnKey, SortField, SortOrder } from '../types/api';
import type { TransactionFilters } from '../utils/filterParams';
import { http } from './http';

export interface ExportRequest {
  columns: ExportColumnKey[];
  filters: TransactionFilters;
  sort: { by: SortField; order: SortOrder };
}

export interface ExportedFile {
  blob: Blob;
  filename: string;
}

const FALLBACK_FILENAME = 'transactions.csv';
// The server streams the file, so large exports can legitimately take longer than an API call.
const EXPORT_TIMEOUT_MS = 120_000;

export async function fetchExportColumns(): Promise<ExportColumn[]> {
  const { data } = await http.get<{ columns: ExportColumn[] }>('/transactions/export/columns');
  return data.columns;
}

/** `attachment; filename="transactions_2024-01-01_to_2024-03-31.csv"` -> the filename. */
export function filenameFromContentDisposition(header: unknown): string {
  if (typeof header !== 'string') return FALLBACK_FILENAME;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  return match?.[1] ? decodeURIComponent(match[1]) : FALLBACK_FILENAME;
}

/**
 * POSTs the export request and returns the file. It can't be a plain link: the token travels in
 * the Authorization header, which a link can't set.
 */
export async function exportTransactionsCsv(request: ExportRequest): Promise<ExportedFile> {
  const response = await http.post<Blob>('/transactions/export', request, {
    responseType: 'blob',
    timeout: EXPORT_TIMEOUT_MS,
  });
  return {
    blob: response.data,
    filename: filenameFromContentDisposition(response.headers['content-disposition']),
  };
}
