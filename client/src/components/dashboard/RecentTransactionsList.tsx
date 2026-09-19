import { Box, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import type { Transaction } from '../../types/api';
import { formatDay } from '../../utils/format';
import { SignedAmount } from '../common/SignedAmount';
import { StatusPill } from '../common/StatusPill';
import { UserAvatar } from '../common/UserAvatar';

export function RecentTransactionsList({ transactions }: { transactions: Transaction[] }) {
  return (
    <List disablePadding>
      {transactions.map((transaction, index) => (
        <ListItem
          key={transaction.id}
          disableGutters
          divider={index < transactions.length - 1}
          sx={{ py: 1.25, gap: 1 }}
        >
          <ListItemAvatar sx={{ minWidth: 52 }}>
            <UserAvatar name={transaction.user_id} size={40} />
          </ListItemAvatar>
          <ListItemText
            primary={transaction.user_id}
            secondary={`${transaction.category} · ${formatDay(transaction.date)}`}
            slotProps={{
              primary: { sx: { fontWeight: 500 } },
              secondary: { sx: { fontSize: 12 } },
            }}
          />
          <Box sx={{ textAlign: 'right', display: 'grid', justifyItems: 'end', gap: 0.5 }}>
            <SignedAmount amount={transaction.amount} category={transaction.category} />
            <StatusPill status={transaction.status} />
          </Box>
        </ListItem>
      ))}
    </List>
  );
}
