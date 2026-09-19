import { Paper, Typography } from '@mui/material';

// Phase 7 shell only: the filterable table arrives in Phase 9.
export function TransactionsPage() {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6">Transactions</Typography>
      <Typography color="text.secondary">
        The searchable, filterable transactions table is built in a later phase.
      </Typography>
    </Paper>
  );
}
