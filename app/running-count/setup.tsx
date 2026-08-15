import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { radii, spacing } from '@/constants/theme';
import { AUTO_DEAL_INTERVALS_MS, CHECKPOINT_FREQUENCIES, DEAL_SPEEDS_MS, ENDLESS_DURATIONS_SECONDS } from '@/features/running-count/constants';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import type { RunningCountMode } from '@/features/running-count/types';
import { SUPPORTED_DECK_COUNTS } from '@/lib/blackjack/shoe';
import { useAppTheme } from '@/lib/useAppTheme';
import { useCardSoundPreference } from '@/hooks/useCardSoundPreference';

const MODE_TITLES: Record<RunningCountMode, string> = {
  countdown: 'Countdown', 'hidden-card': 'Hidden Card', checkpoint: 'Checkpoint Practice',
  speed: 'Speed Drill', cancellation: 'Cancellation Practice', endless: 'Endless Stream',
};
const DECK_OPTIONS = SUPPORTED_DECK_COUNTS.map((value) => ({ label: String(value), value }));
const DEAL_STYLE_OPTIONS = [{ label: 'Manual', value: 'manual' }, { label: 'Auto', value: 'auto' }] as const;
const AUTO_OPTIONS = AUTO_DEAL_INTERVALS_MS.map((value) => ({ label: `${value}ms`, value }));
const SPEED_OPTIONS = DEAL_SPEEDS_MS.map((value) => ({ label: `${value}`, value }));
const CHECKPOINT_OPTIONS = CHECKPOINT_FREQUENCIES.map((value) => ({ label: value === 'random' ? 'Random' : `Every ${value}`, value }));
const CHUNK_OPTIONS = [{ label: '2 cards', value: 2 }, { label: '3 cards', value: 3 }] as const;
const DURATION_OPTIONS = ENDLESS_DURATIONS_SECONDS.map((value) => ({ label: value === 'endless' ? 'Endless' : `${value}s`, value }));

function getMode(value: string | undefined): RunningCountMode {
  return value === 'hidden-card' || value === 'checkpoint' || value === 'speed' || value === 'cancellation' || value === 'endless' ? value : 'countdown';
}

export default function RunningCountSetupScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = getMode(params.mode);
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, saveSettings } = useRunningCount();
  const { cardSoundsEnabled, setCardSoundsEnabled } = useCardSoundPreference();
  const [draft, setDraft] = useState(settings);
  const update = (next: typeof draft) => { setDraft(next); void saveSettings(next); };
  const start = () => {
    void saveSettings(draft);
    router.replace({ pathname: '/running-count/drill', params: { mode } });
  };

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>{MODE_TITLES[mode]}</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Choose the shoe and drill settings. Records remain separate for every mode and deck count.</Text>

      <View style={styles.sections}>
        <Setting title="Decks">
          <SegmentedSelector options={DECK_OPTIONS} value={draft.deckCount} onChange={(deckCount) => update({ ...draft, deckCount })} accessibilityLabel="Deck count" />
          <Text style={[styles.help, { color: colors.textMuted }]}>{draft.deckCount * 52} cards in a complete shoe</Text>
        </Setting>

        {mode === 'countdown' ? (
          <>
            <Setting title="Deal Style">
              <SegmentedSelector options={DEAL_STYLE_OPTIONS} value={draft.countdownDealStyle} onChange={(countdownDealStyle) => update({ ...draft, countdownDealStyle })} accessibilityLabel="Deal style" />
            </Setting>
            {draft.countdownDealStyle === 'auto' ? <Setting title="Auto-deal Interval"><SegmentedSelector options={AUTO_OPTIONS} value={draft.autoDealIntervalMs} onChange={(autoDealIntervalMs) => update({ ...draft, autoDealIntervalMs })} accessibilityLabel="Auto deal interval" /></Setting> : null}
          </>
        ) : null}

        {mode === 'speed' || mode === 'endless' ? <Setting title="Milliseconds per Card"><SegmentedSelector options={SPEED_OPTIONS} value={draft.speedDealIntervalMs} onChange={(speedDealIntervalMs) => update({ ...draft, speedDealIntervalMs })} accessibilityLabel="Card speed" /></Setting> : null}
        {mode === 'checkpoint' ? <Setting title="Checkpoint Frequency"><SegmentedSelector options={CHECKPOINT_OPTIONS} value={draft.checkpointFrequency} onChange={(checkpointFrequency) => update({ ...draft, checkpointFrequency })} accessibilityLabel="Checkpoint frequency" /></Setting> : null}
        {mode === 'cancellation' ? <Setting title="Chunk Size"><SegmentedSelector options={CHUNK_OPTIONS} value={draft.cancellationChunkSize} onChange={(cancellationChunkSize) => update({ ...draft, cancellationChunkSize })} accessibilityLabel="Cancellation chunk size" /></Setting> : null}
        {mode === 'endless' ? <Setting title="Session Duration"><SegmentedSelector options={DURATION_OPTIONS} value={draft.endlessDurationSeconds} onChange={(endlessDurationSeconds) => update({ ...draft, endlessDurationSeconds })} accessibilityLabel="Session duration" /><Text style={[styles.help, { color: colors.textMuted }]}>Cards are drawn from real shoes and reshuffled internally when needed.</Text></Setting> : null}

        <View style={[styles.soundRow, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.soundCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Card Sounds</Text>
            <Text style={[styles.help, { color: colors.textMuted }]}>Play the shared deal sound when each card appears.</Text>
          </View>
          <Switch accessibilityLabel="Card sounds" value={cardSoundsEnabled} onValueChange={(enabled) => { void setCardSoundsEnabled(enabled); update({ ...draft, cardSoundsEnabled: enabled }); }} trackColor={{ true: colors.primary }} />
        </View>
      </View>
      <AppButton label="Start drill" onPress={start} style={styles.start} />
    </Screen>
  );
}

function Setting({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useAppTheme();
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
