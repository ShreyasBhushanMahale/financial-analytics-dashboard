import { Button, Paper, Typography } from '@mui/material';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        This page doesn&apos;t exist
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Check the address, or head back to the dashboard.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Go to the dashboard
      </Button>
    </Paper>
  );
}
