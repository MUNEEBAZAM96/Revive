const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

// Shared brand palette for the Recovery Companion screens.
export const palette = {
  primary: '#2a9d8f',
  primaryDark: '#1f7a70',
  danger: '#e63946',
  calm: '#0b132b',
  surface: '#ffffff',
  surfaceMuted: '#f4f6f8',
  border: '#e1e5ea',
  textPrimary: '#16202b',
  textSecondary: '#5c6b7a',
};

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
