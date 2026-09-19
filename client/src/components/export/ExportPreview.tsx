import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { ExportColumn, Transaction } from '../../types/api';
import { formatCsvCell } from '../../utils/csvPreview';

interface ExportPreviewProps {
  columns: ExportColumn[];
  /** Undefined while loading. */
  rows: Transaction[] | undefined;
  skeletonRows: number;
}

/** The top of the file-to-be: chosen columns, CSV header labels, values as the CSV writes them. */
export function ExportPreview({ columns, rows, skeletonRows }: ExportPreviewProps) {
  if (columns.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        Choose at least one column to see a preview.
      </Typography>
    );
  }

  return (
    <TableContainer
      sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}
      tabIndex={0}
      aria-label="Preview of the first rows of the CSV file"
    >
      <Table size="small" sx={{ '& td, & th': { whiteSpace: 'nowrap', fontSize: 12 } }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} sx={{ fontWeight: 600 }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows === undefined
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton variant="text" width={60} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.key} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatCsvCell(row, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
