import LogoutRounded from '@mui/icons-material/LogoutRounded';
import { Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { useState } from 'react';
import { UserAvatar } from '../components/common/UserAvatar';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../hooks/useAuth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { notify } = useAlerts();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!user) return null;

  const handleLogout = () => {
    setAnchor(null);
    logout();
    notify({ severity: 'info', message: 'You have signed out.' });
  };

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={`Account menu for ${user.name}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
        sx={{ p: 0.5 }}
      >
        <UserAvatar name={user.name} size={40} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 220 }}>
          <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRounded fontSize="small" />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  );
}
