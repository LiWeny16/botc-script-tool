import { createTheme } from '@mui/material';
import { THEME_COLORS, THEME_FONTS } from './colors';
import { dialogComponentTheme } from './dialogTheme';

export const appTheme = createTheme({
  palette: {
    primary: { main: THEME_COLORS.good },
    secondary: { main: THEME_COLORS.evil },
    background: { default: '#f5f5f5' },
    text: { primary: THEME_COLORS.text.primary, secondary: THEME_COLORS.text.secondary },
  },
  typography: { fontFamily: THEME_FONTS.fontFamily },
  breakpoints: { values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 } },
  components: {
    ...dialogComponentTheme,
    MuiDrawer: { defaultProps: { disableScrollLock: true } },
    MuiMenu: { defaultProps: { disableScrollLock: true } },
    MuiPopover: { defaultProps: { disableScrollLock: true } },
  },
});
