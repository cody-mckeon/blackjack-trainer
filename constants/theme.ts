export const lightColors = {
  background: '#F5F7F6',
  surface: '#FFFFFF',
  surfaceMuted: '#E8ECEA',
  text: '#10231C',
  textMuted: '#5E6E68',
  border: '#D8E0DC',
  primary: '#0A7A50',
  primaryPressed: '#075F3E',
  onPrimary: '#FFFFFF',
  success: '#087A4E',
  successSurface: '#DDF5E9',
  danger: '#B8323A',
  dangerSurface: '#FCE4E5',
  warning: '#8A5A00',
} as const;

export const darkColors = {
  background: '#0D1512',
  surface: '#16211D',
  surfaceMuted: '#24312C',
  text: '#F3F7F5',
  textMuted: '#A7B6B0',
  border: '#34443E',
  primary: '#47D69A',
  primaryPressed: '#2AB77D',
  onPrimary: '#082117',
  success: '#54DEA4',
  successSurface: '#133D2D',
  danger: '#FF858A',
  dangerSurface: '#482326',
  warning: '#F2C36B',
} as const;

export type AppColors = typeof lightColors | typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;
