import { Box, List, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { NavLink } from 'react-router';
import { Logo } from '../components/common/Logo';
import { NAV_ITEMS, type NavItem } from './navItems';

// Below `md` the sidebar shrinks to icons only; labels come back as tooltips.
const labelSx = { display: { xs: 'none', md: 'block' } } as const;

const itemSx = {
  position: 'relative',
  minHeight: 48,
  px: { xs: 3, md: 4 },
  color: 'text.secondary',
  '& .MuiListItemIcon-root': { color: 'inherit', minWidth: { xs: 0, md: 44 } },
  '&.active': {
    color: 'primary.main',
    // The yellow tab on the sidebar's edge that marks the current page in the design.
    '&::after': {
      content: '""',
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: 4,
      height: 28,
      borderRadius: '4px 0 0 4px',
      bgcolor: 'warning.main',
    },
  },
} as const;

function SidebarItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  const content = (
    <>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        sx={labelSx}
        slotProps={{ primary: { sx: { fontWeight: 500 } } }}
      />
    </>
  );

  if (!item.path) {
    // Disabled buttons don't fire mouse events, so the span is what the tooltip listens to.
    return (
      <Tooltip title="Coming soon" placement="right">
        <Box component="span" sx={{ display: 'block' }}>
          <ListItemButton disabled sx={itemSx}>
            {content}
          </ListItemButton>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={item.label}
      placement="right"
      // Only needed when the label is hidden.
      slotProps={{ tooltip: { sx: { display: { md: 'none' } } } }}
    >
      <ListItemButton component={NavLink} to={item.path} end sx={itemSx}>
        {content}
      </ListItemButton>
    </Tooltip>
  );
}

export function Sidebar() {
  return (
    <Box
      component="nav"
      aria-label="Main"
      sx={{
        width: { xs: 72, md: 248 },
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3.5 }}>
        <Logo compactBelow="md" />
      </Box>
      <List disablePadding>
        {NAV_ITEMS.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </List>
    </Box>
  );
}
