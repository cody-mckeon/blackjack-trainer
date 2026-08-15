import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TrueCountProvider } from '@/features/true-count/context/TrueCountProvider';
import { BasicStrategyProvider } from '@/features/basic-strategy/context/BasicStrategyProvider';
import { RunningCountProvider } from '@/features/running-count/context/RunningCountProvider';
import { CardSoundPreferenceProvider } from '@/hooks/useCardSoundPreference';
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
        <CardSoundPreferenceProvider>
          <TrueCountProvider>
            <BasicStrategyProvider>
              <RunningCountProvider>
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
                  <Stack.Screen name="true-count/index" options={{ title: 'True Count Trainer' }} />
                  <Stack.Screen name="true-count/settings" options={{ title: 'Practice Setup' }} />
                  <Stack.Screen name="true-count/pattern-recall" options={{ title: 'Pattern Recall' }} />
                  <Stack.Screen name="true-count/drill" options={{ title: 'True Count', headerBackVisible: false, gestureEnabled: false }} />
                  <Stack.Screen name="true-count/summary" options={{ title: 'Session Complete', headerBackVisible: false, gestureEnabled: false }} />
                  <Stack.Screen name="basic-strategy/index" options={{ title: 'Basic Strategy Trainer' }} />
                  <Stack.Screen name="basic-strategy/setup" options={{ title: 'Practice Setup' }} />
                  <Stack.Screen name="basic-strategy/pattern-recall" options={{ title: 'Pattern Recall' }} />
                  <Stack.Screen name="basic-strategy/drill" options={{ title: 'Basic Strategy', headerBackVisible: false, gestureEnabled: false }} />
                  <Stack.Screen name="basic-strategy/summary" options={{ title: 'Session Complete', headerBackVisible: false, gestureEnabled: false }} />
                  <Stack.Screen name="running-count/index" options={{ title: 'Running Count Trainer' }} />
                  <Stack.Screen name="running-count/setup" options={{ title: 'Drill Setup' }} />
                  <Stack.Screen name="running-count/drill" options={{ title: 'Running Count', headerBackVisible: false, gestureEnabled: false }} />
                  <Stack.Screen name="running-count/summary" options={{ title: 'Session Complete', headerBackVisible: false, gestureEnabled: false }} />
                </Stack>
                <StatusBar style="auto" />
              </RunningCountProvider>
            </BasicStrategyProvider>
          </TrueCountProvider>
        </CardSoundPreferenceProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
