import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { MetricCard } from '@/components/MetricCard';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { useTrueCount } from '@/features/true-count/context/TrueCountProvider';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function TrueCountSummaryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { lastSummary, settings, startSession } = useTrueCount();

  if (!lastSummary) {
    return <Redirect href="/" />;
  }

  const trainAgain = () => {
    const sessionSettings =
      lastSummary.mode === 'pattern-recall' ? { ...settings, shoeSize: lastSummary.shoeSize } : settings;
    startSession(sessionSettings, {
      mode: lastSummary.mode,
      patternDecksRemaining: lastSummary.patternDecksRemaining,
    });
    router.replace('/true-count/drill');
  };

  const adjustRoute =
    lastSummary.mode === 'pattern-recall'
      ? '/true-count/pattern-recall'
      : ({ pathname: '/true-count/settings', params: { mode: lastSummary.mode } } as const);

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>
        {lastSummary.mode.replace('-', ' ').toUpperCase()} · SESSION COMPLETE
      </Text>
      <Text style={[styles.heading, { color: colors.text }]}>Nice work.</Text>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>Here’s how the drill went.</Text>

      <View style={styles.metrics}>
        <MetricCard label="Questions" value={String(lastSummary.attempted)} />
        <MetricCard label="Correct" value={String(lastSummary.correct)} />
        <MetricCard label="Accuracy" value={formatPercentage(lastSummary.accuracyPercentage)} />
        <MetricCard label="Best streak" value={String(lastSummary.bestStreak)} />
        <MetricCard label="Avg. time" value={formatResponseTime(lastSummary.averageResponseTimeMs)} />
        <MetricCard label="Automatic" value={formatPercentage(lastSummary.automaticPercentage)} />
      </View>

      {lastSummary.weakestPatterns.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weakest patterns</Text>
          <View style={[styles.patternList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {lastSummary.weakestPatterns.map((pattern, index) => (
              <View key={pattern.decksRemaining} style={styles.patternRow}>
                <Text style={[styles.patternRank, { color: colors.primary }]}>{index + 1}</Text>
                <Text style={[styles.patternName, { color: colors.text }]}>{pattern.decksRemaining} decks</Text>
                <Text style={[styles.patternStats, { color: colors.textMuted }]}>
                  {formatPercentage(pattern.accuracyPercentage)} · {formatResponseTime(pattern.averageResponseTimeMs)} avg
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.recommendation, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.recommendationLabel, { color: colors.primary }]}>NEXT STEP</Text>
        <Text style={[styles.recommendationText, { color: colors.text }]}>{lastSummary.recommendation}</Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Train again" onPress={trainAgain} />
        <AppButton label="Adjust settings" onPress={() => router.replace(adjustRoute)} variant="secondary" />
        <AppButton label="Back to True Count" onPress={() => router.replace('/true-count')} variant="ghost" />
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
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: 19,
    fontWeight: '900',
  },
  patternList: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  patternRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  patternRank: {
    width: 20,
    fontSize: 14,
    fontWeight: '900',
  },
  patternName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  patternStats: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  recommendation: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  recommendationText: {
    marginTop: spacing.xs,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
});
