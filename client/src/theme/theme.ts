import { alpha, createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

declare module '@mui/material/styles' {
  interface TypeBackground {
    /** The darkest surface, used behind the login card. */
    deep: string;
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    // Dark text on the green and yellow fills: white on #1FCB4F fails WCAG contrast.
    primary: { main: tokens.green, contrastText: tokens.background.deep },
    secondary: { main: tokens.purple },
    success: { main: tokens.green, contrastText: tokens.background.deep },
    warning: { main: tokens.yellow, contrastText: tokens.background.deep },
    error: { main: tokens.orange },
    info: { main: tokens.cyan },
    background: {
      default: tokens.background.page,
      paper: tokens.background.panel,
      deep: tokens.background.deep,
    },
    text: { primary: tokens.text.primary, secondary: tokens.text.secondary },
    divider: alpha(tokens.text.primary, 0.08),
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Poppins", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      // Dark mode normally lightens raised surfaces with a gradient overlay, which would drift
      // the panels away from the design's exact colour.
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.background.page,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
        },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
    },
  },
});
