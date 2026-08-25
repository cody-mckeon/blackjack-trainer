import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { MetricCard } from '@/components/MetricCard';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { useDeckEstimation } from '@/features/deck-estimation/context/DeckEstimationProvider';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function DeckEstimationSummaryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { lastSummary, settings, startSession } = useDeckEstimation();

  if (!lastSummary) return <Redirect href="/deck-estimation" />;

  const trainAgain = () => {
    startSession(settings);
    router.replace('/deck-estimation/drill');
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>DECK ESTIMATION · SESSION COMPLETE</Text>
      <Text style={[styles.heading, { color: colors.text }]}>Landmarks trained.</Text>
      <Text style={[styles.subheading, { color: colors.textMuted }]}>Here’s what your visual recall looked like.</Text>

      <View style={styles.metrics}>
        <MetricCard label="Questions" value={String(lastSummary.attempted)} />
        <MetricCard label="Accuracy" value={formatPercentage(lastSummary.accuracyPercentage)} />
        <MetricCard label="Best streak" value={String(lastSummary.bestStreak)} />
        <MetricCard label="Avg. time" value={formatResponseTime(lastSummary.averageResponseTimeMs)} />
        <MetricCard label="Automatic" value={formatPercentage(lastSummary.automaticPercentage)} />
      </View>

      {lastSummary.weakestEstimates.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weakest estimates</Text>
          <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {lastSummary.weakestEstimates.map((estimate) => (
              <View key={estimate.decksRemaining} style={styles.row}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{estimate.decksRemaining} decks</Text>
                <Text style={[styles.rowStats, { color: colors.textMuted }]}>
                  {formatPercentage(estimate.accuracyPercentage)} · {formatResponseTime(estimate.averageResponseTimeMs)} avg
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {lastSummary.confusionPairs.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Common confusions</Text>
          <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {lastSummary.confusionPairs.map((pair) => (
              <View key={`${pair.expected}-${pair.answered}`} style={styles.row}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{pair.expected} → {pair.answered}</Text>
                <Text style={[styles.rowStats, { color: colors.textMuted }]}>{pair.count} {pair.count === 1 ? 'time' : 'times'}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.recommendation, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.recommendationLabel, { color: colors.primary }]}>NEXT STEP</Text>
        <Text style={[styles.recommendationText, { color: colors.text }]}>Use Calibration to compare your weakest estimate with the half-deck landmark above and below it.</Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Train again" onPress={trainAgain} />
        <AppButton label="Adjust settings" variant="secondary" onPress={() => router.replace('/deck-estimation/setup')} />
        <AppButton label="Open Calibration" variant="secondary" onPress={() => router.replace('/deck-estimation/calibration')} />
        <AppButton label="Back to Deck Estimation" variant="ghost" onPress={() => router.replace('/deck-estimation')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  eyebrow: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  heading: { marginTop: spacing.sm, textAlign: 'center', fontSize: 34, fontWeight: '900', letterSpacing: -0.9 },
  subheading: { marginTop: spacing.sm, textAlign: 'center', fontSize: 16 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  section: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md, fontSize: 19, fontWeight: '900' },
  list: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md },
  row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitle: { flex: 1, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] },
  rowStats: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  recommendation: { marginTop: spacing.lg, borderRadius: radii.md, padding: spacing.md },
  recommendationLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  recommendationText: { marginTop: spacing.xs, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
