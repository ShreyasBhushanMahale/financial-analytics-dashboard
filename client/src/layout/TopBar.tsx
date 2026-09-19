import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useLocation } from 'react-router';
import { titleForPath } from './navItems';
import { UserMenu } from './UserMenu';

export function TopBar() {
  const { pathname } = useLocation();

  return (
    <Box
      component="header"
      sx={{
        height: 80,
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
      }}
    >
      <Typography component="h1" variant="h5">
        {titleForPath(pathname)}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Tooltip title="Coming soon">
          <span>
            <IconButton disabled aria-label="Notifications (coming soon)">
              <NotificationsNoneOutlined />
            </IconButton>
          </span>
        </Tooltip>
        <UserMenu />
      </Stack>
    </Box>
  );
}
