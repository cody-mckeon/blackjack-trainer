import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TrueCountProvider } from '@/features/true-count/context/TrueCountProvider';
import { useAppTheme } from '@/lib/useAppTheme';

export default function RootLayout() {
  const { colors, isDark } = useAppTheme();
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <TrueCountProvider>
          <Stack
            screenOptions={{
              headerBackTitle: 'Back',
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="true-count/settings" options={{ title: 'True Count Trainer' }} />
            <Stack.Screen
              name="true-count/drill"
              options={{ title: 'True Count', headerBackVisible: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="true-count/summary"
              options={{ title: 'Session Complete', headerBackVisible: false, gestureEnabled: false }}
            />
          </Stack>
          <StatusBar style="auto" />
        </TrueCountProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
