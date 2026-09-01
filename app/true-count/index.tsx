import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { TrainingModeCard } from '@/components/TrainingModeCard';
import { radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/lib/useAppTheme';

export default function TrueCountModesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>Build automatic recall</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Choose how you want to practice true-count patterns.</Text>

      <View style={[styles.learningNote, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.learningNoteText, { color: colors.text }]}>The goal isn’t faster long division. Recognize common running-count and decks-remaining patterns until the true count becomes automatic.</Text>
      </View>

      <View style={styles.modes}>
        <TrainingModeCard
          title="Standard Practice"
          description="A balanced mix of running counts and decks remaining."
          enabled
          onPress={() => router.push({ pathname: '/true-count/settings', params: { mode: 'standard' } })}
        />
        <TrainingModeCard
          title="Adaptive Practice"
          description="See difficult, slow, and overdue patterns more often."
          enabled
          onPress={() => router.push({ pathname: '/true-count/settings', params: { mode: 'adaptive' } })}
        />
        <TrainingModeCard
          title="Pattern Recall"
          description="Study one decks-remaining value like a multiplication table."
          actionLabel="Study"
          enabled
          onPress={() => router.push('/true-count/pattern-recall')}
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
  learningNoteText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  modes: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
