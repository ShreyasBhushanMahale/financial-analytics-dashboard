import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useId, useState, type FormEvent } from 'react';
import {
  PREVIEW_ROWS,
  useExportColumns,
  useExportCsv,
  useExportPreview,
} from '../../hooks/useExport';
import { useAlerts } from '../../hooks/useAlerts';
import type { ExportColumnKey, SortField, SortOrder } from '../../types/api';
import { describeSort } from '../../utils/csvPreview';
import { downloadBlob } from '../../utils/download';
import { loadExportColumns, saveExportColumns } from '../../utils/exportColumnsStorage';
import type { TransactionFilters } from '../../utils/filterParams';
import { formatCount } from '../../utils/format';
import { ErrorState } from '../common/ErrorState';
import { ColumnPicker } from './ColumnPicker';
import { ExportPreview } from './ExportPreview';
import { ScopeToggle, type ExportScope } from './ScopeToggle';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  hasFilters: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
}

type ExportFormProps = Omit<ExportDialogProps, 'open'> & { titleId: string };

// Rendered only while the dialog is open, so every opening starts fresh from the current filters
// and the saved column choice.
function ExportForm({ onClose, filters, hasFilters, sortBy, sortOrder, titleId }: ExportFormProps) {
  const formId = useId();
  const { notify } = useAlerts();
  const columns = useExportColumns();
  const current = useExportPreview(filters, sortBy, sortOrder);
  const all = useExportPreview({}, sortBy, sortOrder);
  const exportCsv = useExportCsv();

  const [scope, setScope] = useState<ExportScope>(hasFilters ? 'current' : 'all');
  // null until the user changes something: until then, the saved choice applies.
  const [chosen, setChosen] = useState<ExportColumnKey[] | null>(null);

  const available = columns.data ?? [];
  const selected = chosen ?? loadExportColumns(available.map((column) => column.key));
  const selectedColumns = available.filter((column) => selected.includes(column.key));
  const preview = scope === 'current' ? current : all;
  const rowCount = preview.data?.meta.total;

  const blockedBecause = columns.isPending
    ? 'Loading columns…'
    : selected.length === 0
      ? 'Choose at least one column.'
      : rowCount === 0
        ? 'There are no rows to export.'
        : rowCount === undefined
          ? 'Counting rows…'
          : undefined;

  const changeColumns = (next: ExportColumnKey[]) => {
    setChosen(next);
    saveExportColumns(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (blockedBecause) return;
    exportCsv.mutate(
      {
        columns: selectedColumns.map((column) => column.key),
        filters: scope === 'current' ? filters : {},
        sort: { by: sortBy, order: sortOrder },
      },
      {
        onSuccess: ({ blob, filename }) => {
          downloadBlob(blob, filename);
          notify({
            severity: 'success',
            message: `Exported ${formatCount(rowCount ?? 0)} rows to ${filename}.`,
          });
          onClose();
        },
        // On failure the global handler shows the server's message as a chip, and the dialog
        // stays open so the user can adjust and retry.
      },
    );
  };

  return (
    <>
      <DialogTitle id={titleId}>Export transactions to CSV</DialogTitle>
      <DialogContent dividers>
        <Stack component="form" id={formId} onSubmit={submit} spacing={2.5}>
          <ScopeToggle
            value={scope}
            onChange={setScope}
            hasFilters={hasFilters}
            currentCount={current.data?.meta.total}
            allCount={all.data?.meta.total}
          />
          <Divider />
          {columns.isError ? (
            <ErrorState
              message="Couldn't load the column list."
              onRetry={() => void columns.refetch()}
              minHeight={120}
            />
          ) : columns.isPending ? (
            <Skeleton variant="rounded" height={140} />
          ) : (
            <ColumnPicker columns={available} selected={selected} onChange={changeColumns} />
          )}
          <Divider />
          <Box>
            <Typography variant="subtitle2">Preview</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {rowCount === undefined
                ? 'Loading…'
                : rowCount === 0
                  ? 'No transactions to export.'
                  : `First ${Math.min(PREVIEW_ROWS, rowCount)} of ${formatCount(rowCount)} rows, ${describeSort(sortBy, sortOrder)}.`}
            </Typography>
            {preview.isError ? (
              <ErrorState
                message="Couldn't load the preview."
                onRetry={() => void preview.refetch()}
                minHeight={100}
              />
            ) : (
              rowCount !== 0 && (
                <ExportPreview
                  columns={selectedColumns}
                  rows={preview.data?.data}
                  skeletonRows={PREVIEW_ROWS}
                />
              )
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Typography variant="caption" color="text.secondary" role="status" sx={{ mr: 'auto' }}>
          {blockedBecause}
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="submit"
          form={formId}
          variant="contained"
          disabled={blockedBecause !== undefined}
          loading={exportCsv.isPending}
          loadingPosition="start"
        >
          {exportCsv.isPending ? 'Exporting…' : 'Export CSV'}
        </Button>
      </DialogActions>
    </>
  );
}

/** Keyboard accessible (MUI traps focus and closes on Escape) and returns focus to its trigger. */
export function ExportDialog({ open, ...formProps }: ExportDialogProps) {
  const titleId = useId();
  return (
    <Dialog
      open={open}
      onClose={formProps.onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
    >
      {open && <ExportForm {...formProps} titleId={titleId} />}
    </Dialog>
  );
}
