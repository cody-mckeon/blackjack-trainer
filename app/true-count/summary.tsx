import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { MetricCard } from '@/components/MetricCard';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { useTrueCount } from '@/features/true-count/context/TrueCountProvider';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function TrueCountSummaryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { lastSummary, startSession } = useTrueCount();

  if (!lastSummary) {
    return <Redirect href="/" />;
  }

  const trainAgain = () => {
    startSession();
    router.replace('/true-count/drill');
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SESSION COMPLETE</Text>
      <Text style={[styles.heading, { color: colors.text }]}>Nice work.</Text>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>Here’s how the drill went.</Text>

      <View style={styles.metrics}>
        <MetricCard label="Questions" value={String(lastSummary.attempted)} />
        <MetricCard label="Correct" value={String(lastSummary.correct)} />
        <MetricCard label="Accuracy" value={formatPercentage(lastSummary.accuracyPercentage)} />
        <MetricCard label="Best streak" value={String(lastSummary.bestStreak)} />
        <MetricCard label="Avg. time" value={formatResponseTime(lastSummary.averageResponseTimeMs)} />
      </View>

      <View style={styles.actions}>
        <AppButton label="Train again" onPress={trainAgain} />
        <AppButton label="Adjust settings" onPress={() => router.replace('/true-count/settings')} variant="secondary" />
        <AppButton label="Back to modes" onPress={() => router.replace('/')} variant="ghost" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxl,
  },
  eyebrow: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  heading: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subheading: {
    marginTop: spacing.sm,
    textAlign: 'center',
    fontSize: 16,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
