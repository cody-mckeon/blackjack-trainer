import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { TrainingModeCard } from '@/components/TrainingModeCard';
import { radii, spacing } from '@/constants/theme';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import type { RunningCountMode } from '@/features/running-count/types';
import { useAppTheme } from '@/lib/useAppTheme';

const MODES: readonly [RunningCountMode, string, string][] = [
  ['countdown', 'Countdown', 'Count a complete shuffled shoe in manual or auto-deal mode.'],
  ['hidden-card', 'Hidden Card', 'Count the shoe, then infer the category of one removed card.'],
  ['checkpoint', 'Checkpoint Practice', 'Pause during the shoe to pinpoint exactly where the count diverges.'],
  ['speed', 'Speed Drill', 'Hold an accurate count at a fixed automatic deal speed.'],
  ['cancellation', 'Cancellation Practice', 'Recognize the net value of two- or three-card chunks.'],
  ['endless', 'Endless Stream', 'Maintain the count without relying on a shoe ending at zero.'],
];

export default function RunningCountModesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, personalBests } = useRunningCount();
  const recordsForDeck = personalBests.filter((record) => record.deckCount === settings.deckCount);

  return (
    <Screen>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>HI-LO · {settings.deckCount} DECK{settings.deckCount === 1 ? '' : 'S'}</Text>
      <Text style={[styles.heading, { color: colors.text }]}>Make the count automatic</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Fast, focused running-count drills. No true-count conversion or strategy decisions.</Text>

      {recordsForDeck.length ? (
        <View style={[styles.progress, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.progressText, { color: colors.text }]}>{recordsForDeck.length} mode{recordsForDeck.length === 1 ? '' : 's'} practiced at this shoe size</Text>
        </View>
      ) : null}

      <View style={styles.modes}>
        {MODES.map(([mode, title, description]) => (
          <TrainingModeCard
            key={mode}
            title={title}
            description={description}
            enabled
            onPress={() => router.push({ pathname: '/running-count/setup', params: { mode } })}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  heading: { marginTop: spacing.sm, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  intro: { marginTop: spacing.sm, fontSize: 16, lineHeight: 23 },
  progress: { marginTop: spacing.lg, borderRadius: radii.md, padding: spacing.md },
  progressText: { fontSize: 14, fontWeight: '700' },
  modes: { gap: spacing.md, marginTop: spacing.xl },
});
