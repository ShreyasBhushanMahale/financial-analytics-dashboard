import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import InsertChartOutlined from '@mui/icons-material/InsertChartOutlined';
import MailOutlined from '@mui/icons-material/MailOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import type { SvgIconComponent } from '@mui/icons-material';

export interface NavItem {
  label: string;
  icon: SvgIconComponent;
  /** Items without a path are in the design but not built; they render disabled. */
  path?: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Dashboard', icon: GridViewRounded, path: '/' },
  { label: 'Transactions', icon: ReceiptLongOutlined, path: '/transactions' },
  { label: 'Wallet', icon: AccountBalanceWalletOutlined },
  { label: 'Analytics', icon: InsertChartOutlined },
  { label: 'Personal', icon: PersonOutlined },
  { label: 'Message', icon: MailOutlined },
  { label: 'Setting', icon: SettingsOutlined },
];

/** The page title for a path, as shown in the top bar. */
export function titleForPath(pathname: string): string {
  return NAV_ITEMS.find((item) => item.path === pathname)?.label ?? 'Page not found';
}
