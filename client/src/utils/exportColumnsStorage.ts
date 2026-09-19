import type { ExportColumnKey } from '../types/api';

const STORAGE_KEY = 'ledgerline.exportColumns';

/**
 * The column choice from last time, limited to columns that still exist. Falls back to every
 * column when nothing usable was saved, or when storage is unavailable.
 */
export function loadExportColumns(available: readonly ExportColumnKey[]): ExportColumnKey[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(parsed)) {
      const saved = available.filter((key) => parsed.includes(key));
      if (saved.length > 0) return saved;
    }
  } catch {
    // Corrupt or blocked storage: start from the default.
  }
  return [...available];
}

/** Remembers a selection. An empty one isn't saved: nobody wants to start from nothing. */
export function saveExportColumns(columns: readonly ExportColumnKey[]): void {
  if (columns.length === 0) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // Not remembered this time; the export itself is unaffected.
  }
}
