import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MetricCard } from '@/components/MetricCard';
import { Screen } from '@/components/Screen';
import { TrainingModeCard } from '@/components/TrainingModeCard';
import { radii, spacing } from '@/constants/theme';
import { useDeckEstimation } from '@/features/deck-estimation/context/DeckEstimationProvider';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function DeckEstimationModesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { recentSessions, fastestPerfectAverageMs } = useDeckEstimation();
  const latest = recentSessions[0];

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>Learn the discard tray</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Build a visual feel for decks remaining before combining it with the running count.</Text>

      <View style={[styles.learningNote, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.learningNoteTitle, { color: colors.primary }]}>VISUAL FIRST</Text>
        <Text style={[styles.learningNoteText, { color: colors.text }]}>Study the landmarks, then answer from the tray—not from arithmetic.</Text>
      </View>

      {latest ? (
        <View style={styles.metrics}>
          <MetricCard label="Latest accuracy" value={formatPercentage(latest.accuracyPercentage)} />
          <MetricCard label="Latest avg." value={formatResponseTime(latest.averageResponseTimeMs)} />
          {fastestPerfectAverageMs !== null ? (
            <MetricCard label="Perfect best" value={formatResponseTime(fastestPerfectAverageMs)} />
          ) : null}
        </View>
      ) : null}

      <View style={styles.modes}>
        <TrainingModeCard
          title="Calibration"
          description="Study real-photo quarter-deck landmarks at your own pace."
          actionLabel="Study"
          enabled
          onPress={() => router.push('/deck-estimation/calibration')}
        />
        <TrainingModeCard
          title="Whole Deck Practice"
          description="Recognize the major one-deck landmarks."
          enabled
          onPress={() => router.push({ pathname: '/deck-estimation/setup', params: { mode: 'whole' } })}
        />
        <TrainingModeCard
          title="Half Deck Practice"
          description="Train realistic half-deck estimates for true-count work."
          enabled
          onPress={() => router.push({ pathname: '/deck-estimation/setup', params: { mode: 'half' } })}
        />
        <TrainingModeCard
          title="Mixed Practice"
          description="Mix shoe sizes and whole- or half-deck estimates."
          enabled
          onPress={() => router.push({ pathname: '/deck-estimation/setup', params: { mode: 'mixed' } })}
        />
        <TrainingModeCard
          title="Quarter Deck Practice"
          description="Recognize precise quarter-deck landmarks from real tray photos."
          enabled
          onPress={() => router.push({ pathname: '/deck-estimation/setup', params: { mode: 'quarter' } })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  intro: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 23,
  },
  learningNote: {
    marginTop: spacing.lg,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  learningNoteTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  learningNoteText: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  modes: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
