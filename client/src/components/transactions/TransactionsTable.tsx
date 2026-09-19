import {
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SortField, SortOrder, Transaction } from '../../types/api';
import { formatDateTimeUtc, formatDayWithWeekday } from '../../utils/format';
import { CategoryChip } from '../common/CategoryChip';
import { SignedAmount } from '../common/SignedAmount';
import { StatusPill } from '../common/StatusPill';
import { UserAvatar } from '../common/UserAvatar';

interface Column {
  field: SortField;
  label: string;
  align?: 'right';
}

const COLUMNS: readonly Column[] = [
  { field: 'id', label: 'ID' },
  { field: 'user_id', label: 'User' },
  { field: 'date', label: 'Date' },
  { field: 'category', label: 'Category' },
  { field: 'amount', label: 'Amount', align: 'right' },
  { field: 'status', label: 'Status' },
];

interface TransactionsTableProps {
  rows: Transaction[];
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  /** Render this many placeholder rows instead of `rows` (first load). */
  skeletonRows?: number;
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <TableRow hover>
      <TableCell sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
        #{transaction.id}
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <UserAvatar name={transaction.user_id} size={32} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {transaction.user_id}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title={formatDateTimeUtc(transaction.date)} placement="top">
          <span>{formatDayWithWeekday(transaction.date)}</span>
        </Tooltip>
      </TableCell>
      <TableCell>
        <CategoryChip category={transaction.category} />
      </TableCell>
      <TableCell align="right">
        <SignedAmount amount={transaction.amount} category={transaction.category} />
      </TableCell>
      <TableCell>
        <StatusPill status={transaction.status} />
      </TableCell>
    </TableRow>
  );
}

function SkeletonRow() {
  return (
    <TableRow>
      {COLUMNS.map((column) => (
        <TableCell key={column.field} align={column.align}>
          <Skeleton variant="text" width={column.field === 'user_id' ? 120 : 72} />
        </TableCell>
      ))}
    </TableRow>
  );
}

/** Presentational: renders rows and reports header clicks. Paging and fetching live elsewhere. */
export function TransactionsTable({
  rows,
  sortBy,
  sortOrder,
  onSort,
  skeletonRows,
}: TransactionsTableProps) {
  return (
    // Scrolls sideways on narrow screens instead of squashing the columns.
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table aria-label="Transactions" sx={{ minWidth: 760 }}>
        <TableHead>
          <TableRow
            sx={{
              '& th': { bgcolor: 'background.default', borderBottom: 'none', whiteSpace: 'nowrap' },
              '& th:first-of-type': { borderRadius: '8px 0 0 8px' },
              '& th:last-of-type': { borderRadius: '0 8px 8px 0' },
            }}
          >
            {COLUMNS.map((column) => {
              const isSorted = sortBy === column.field;
              return (
                <TableCell
                  key={column.field}
                  align={column.align}
                  sortDirection={isSorted ? sortOrder : false}
                >
                  <TableSortLabel
                    active={isSorted}
                    direction={isSorted ? sortOrder : 'asc'}
                    onClick={() => onSort(column.field)}
                    sx={{ color: 'text.secondary', '&.Mui-active': { color: 'text.primary' } }}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {skeletonRows
            ? Array.from({ length: skeletonRows }, (_, index) => <SkeletonRow key={index} />)
            : rows.map((row) => <TransactionRow key={row.id} transaction={row} />)}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
