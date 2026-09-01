import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from '@/constants/theme';

export function useAppTheme() {
  const colorScheme = useColorScheme();

  return {
    colors: colorScheme === 'dark' ? darkColors : lightColors,
    isDark: colorScheme === 'dark',
  };
}
