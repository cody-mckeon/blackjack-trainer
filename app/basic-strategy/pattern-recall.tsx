import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { ALL_HAND_PATTERNS, HAND_CATEGORY_LABELS } from '@/features/basic-strategy/constants';
import { useBasicStrategy } from '@/features/basic-strategy/context/BasicStrategyProvider';
import type { HandCategory, HandPattern } from '@/features/basic-strategy/types';
import { useAppTheme } from '@/lib/useAppTheme';

export default function BasicStrategyPatternRecallScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, startSession } = useBasicStrategy();
  const categories: HandCategory[] = ['hard', 'soft', 'pair'];

  const start = (pattern: HandPattern) => {
    startSession({ mode: 'pattern-recall', pattern });
    router.replace('/basic-strategy/drill');
  };

  return (
    <Screen>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{settings.rules} RULES</Text>
      <Text style={[styles.heading, { color: colors.text }]}>Choose a pattern</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Each cycle covers all ten dealer upcards in random order.</Text>
      {categories.map((category) => (
        <View key={category} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{HAND_CATEGORY_LABELS[category]}</Text>
          <View style={styles.grid}>
            {ALL_HAND_PATTERNS.filter((pattern) => pattern.category === category).map((pattern) => (
              <AppButton key={pattern.label} label={pattern.label.replace('Pair of ', '')} variant="secondary" onPress={() => start(pattern)} style={styles.patternButton} />
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  heading: { marginTop: spacing.sm, fontSize: 30, fontWeight: '900' },
  intro: { marginTop: spacing.sm, fontSize: 15, lineHeight: 22 },
  section: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md, fontSize: 19, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  patternButton: { flexGrow: 1, flexBasis: '28%', minWidth: 98, paddingHorizontal: spacing.sm },
});
