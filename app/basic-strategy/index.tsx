import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Screen } from '@/components/Screen';
import { TrainingModeCard } from '@/components/TrainingModeCard';
import { radii, spacing } from '@/constants/theme';
import { useBasicStrategy } from '@/features/basic-strategy/context/BasicStrategyProvider';
import { useAppTheme } from '@/lib/useAppTheme';

export default function BasicStrategyModesScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings } = useBasicStrategy();

  return (
    <Screen>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{settings.rules} RULES</Text>
      <Text style={[styles.heading, { color: colors.text }]}>Make the play automatic</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Read the cards, recognize the hand, and act quickly.</Text>

      <View style={[styles.note, { backgroundColor: colors.surfaceMuted }]}> 
        <Text style={[styles.noteText, { color: colors.text }]}>Pure basic strategy from the Blackjack Apprenticeship {settings.rules} chart. No count deviations.</Text>
      </View>

      <View style={styles.modes}>
        <TrainingModeCard title="Standard Practice" description="A random mix of hard totals, soft totals, and pairs." enabled onPress={() => router.push({ pathname: '/basic-strategy/setup', params: { mode: 'standard' } })} />
        <TrainingModeCard title="Category Practice" description="Focus only on hard totals, soft totals, or pairs." enabled onPress={() => router.push({ pathname: '/basic-strategy/setup', params: { mode: 'category' } })} />
        <TrainingModeCard title="Pattern Recall" description="Drill one exact hand against every dealer upcard." actionLabel="Study" enabled onPress={() => router.push('/basic-strategy/pattern-recall')} />
        <TrainingModeCard title="Adaptive Practice" description="See incorrect, slow, and overdue patterns more often." enabled onPress={() => router.push({ pathname: '/basic-strategy/setup', params: { mode: 'adaptive' } })} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  heading: { marginTop: spacing.sm, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  intro: { marginTop: spacing.sm, fontSize: 16, lineHeight: 23 },
  note: { marginTop: spacing.lg, borderRadius: radii.md, padding: spacing.md },
  noteText: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  modes: { gap: spacing.md, marginTop: spacing.xl },
});
