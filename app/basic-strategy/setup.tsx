import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { radii, spacing } from '@/constants/theme';
import { useBasicStrategy } from '@/features/basic-strategy/context/BasicStrategyProvider';
import type { BasicStrategyPracticeMode, HandCategory } from '@/features/basic-strategy/types';
import { useAppTheme } from '@/lib/useAppTheme';

const RULE_OPTIONS = [{ label: 'H17', value: 'H17' }, { label: 'S17', value: 'S17' }] as const;
const TOTAL_OPTIONS = [
  { label: 'Before', value: 'before' },
  { label: 'After', value: 'after' },
  { label: 'Hide', value: 'hidden' },
] as const;
const CATEGORY_OPTIONS = [
  { label: 'Hard', value: 'hard' },
  { label: 'Soft', value: 'soft' },
  { label: 'Pairs', value: 'pair' },
] as const;
const LENGTH_OPTIONS = [{ label: '10', value: 10 }, { label: '25', value: 25 }, { label: '50', value: 50 }, { label: '∞', value: 'endless' }] as const;

export default function BasicStrategySetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: BasicStrategyPracticeMode = params.mode === 'category' || params.mode === 'adaptive' ? params.mode : 'standard';
  const { colors } = useAppTheme();
  const { settings, saveSettings, startSession } = useBasicStrategy();
  const [draft, setDraft] = useState(settings);
  const [category, setCategory] = useState<HandCategory>('hard');

  const updateDraft = (next: typeof draft) => {
    setDraft(next);
    void saveSettings(next);
  };

  const start = () => {
    void saveSettings(draft);
    startSession({ mode, category: mode === 'category' ? category : undefined }, draft);
    router.replace('/basic-strategy/drill');
  };

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>{mode === 'adaptive' ? 'Adaptive practice' : mode === 'category' ? 'Category practice' : 'Standard practice'}</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Set the table rules and how much hand information you want to see.</Text>

      <View style={styles.sections}>
        <SettingSection title="Dealer Soft 17" colors={colors}>
          <SegmentedSelector options={RULE_OPTIONS} value={draft.rules} onChange={(rules) => updateDraft({ ...draft, rules })} accessibilityLabel="Dealer soft 17 rule" />
          <Text style={[styles.help, { color: colors.textMuted }]}>{draft.rules === 'H17' ? 'Dealer hits soft 17' : 'Dealer stands on soft 17'}</Text>
        </SettingSection>

        {mode === 'category' ? (
          <SettingSection title="Hand Category" colors={colors}>
            <SegmentedSelector options={CATEGORY_OPTIONS} value={category} onChange={setCategory} accessibilityLabel="Hand category" />
          </SettingSection>
        ) : null}

        <SettingSection title="Hand Total Display" colors={colors}>
          <SegmentedSelector options={TOTAL_OPTIONS} value={draft.handTotalDisplay} onChange={(handTotalDisplay) => updateDraft({ ...draft, handTotalDisplay })} accessibilityLabel="Hand total display" />
          <Text style={[styles.help, { color: colors.textMuted }]}>Before answer, reveal after answer, or never reveal during the drill.</Text>
        </SettingSection>

        <SettingSection title="Session Length" colors={colors}>
          <SegmentedSelector options={LENGTH_OPTIONS} value={draft.sessionLength} onChange={(sessionLength) => updateDraft({ ...draft, sessionLength })} accessibilityLabel="Session length" />
        </SettingSection>

        <View style={[styles.soundRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.soundCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Card Sounds</Text>
            <Text style={[styles.help, { color: colors.textMuted }]}>Quick local deal sounds. No background music.</Text>
          </View>
          <Switch accessibilityLabel="Card sounds" value={draft.cardSoundsEnabled} onValueChange={(cardSoundsEnabled) => updateDraft({ ...draft, cardSoundsEnabled })} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      <AppButton label="Start practice" onPress={start} style={styles.start} />
    </Screen>
  );
}

function SettingSection({ title, colors, children }: { title: string; colors: ReturnType<typeof useAppTheme>['colors']; children: React.ReactNode }) {
  return <View><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  heading: { fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  intro: { marginTop: spacing.sm, fontSize: 16, lineHeight: 23 },
  sections: { gap: spacing.lg, marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.sm, fontSize: 17, fontWeight: '800' },
  help: { marginTop: spacing.sm, fontSize: 13, lineHeight: 19 },
  soundRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radii.md, padding: spacing.md },
  soundCopy: { flex: 1 },
  start: { marginTop: spacing.xl },
});
