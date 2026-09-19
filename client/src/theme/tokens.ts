// Sampled pixel-for-pixel from the Figma colour styles in design/05*-colors-*.png, which carry no
// hex labels. Components never use these directly: they read them through the MUI theme.
export const tokens = {
  background: {
    /** "Bg main": the deepest surface, behind the login card. */
    deep: '#111317',
    /** "Bg sec": sidebar, top bar, cards and panels. */
    panel: '#1A1C22',
    /** "Bg sec2": the page behind the panels, and inputs sitting on a panel. */
    page: '#282C35',
  },
  green: '#1FCB4F',
  yellow: '#FFC01E',
  orange: '#F46D22',
  purple: '#6D61FF',
  cyan: '#64CFF9',
  text: {
    primary: '#FFFFFF',
    secondary: '#9A9A9A',
  },
} as const;
