import { useEffect, useState, type PropsWithChildren } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PlayingCard } from '@/components/PlayingCard';
import { radii, spacing } from '@/constants/theme';
import { useCardSounds } from '@/hooks/useCardSounds';
import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { useAppTheme } from '@/lib/useAppTheme';

export function useElapsedTime(startedAt: number, active = true) {
  const [elapsedTimeMs, setElapsedTimeMs] = useState(() => Math.max(0, Date.now() - startedAt));
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setElapsedTimeMs(Date.now() - startedAt), 100);
    return () => clearInterval(timer);
  }, [active, startedAt]);
  return elapsedTimeMs;
}

export function useCardRevealSound(enabled: boolean, revealKey: string | number, cardCount = 1) {
  const { playDealSequence, clearScheduledSounds } = useCardSounds(enabled);
  useEffect(() => {
    playDealSequence(cardCount);
    return clearScheduledSounds;
  }, [cardCount, clearScheduledSounds, playDealSequence, revealKey]);
}

export function DrillHeader({ elapsedTimeMs, progress, secondary }: { elapsedTimeMs: number; progress: string; secondary?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <Text style={[styles.headerText, { color: colors.textMuted }]}>{progress}</Text>
      <Text style={[styles.timer, { color: colors.text }]}>{(elapsedTimeMs / 1000).toFixed(1)}s</Text>
      <Text style={[styles.headerText, styles.right, { color: colors.primary }]}>{secondary ?? ''}</Text>
    </View>
  );
}

export function CardStage({ cards, label }: { cards: readonly PlayingCardModel[]; label?: string }) {
  return (
    <View style={styles.stage}>
      {label ? <Text style={styles.stageLabel}>{label}</Text> : null}
      <View style={styles.cards}>
        {cards.map((card, index) => <PlayingCard key={`${card.rank}-${card.suit}-${index}`} card={card} size="large" />)}
      </View>
    </View>
  );
}

export function AnswerPanel({
  title,
  value,
  onChange,
  children,
}: PropsWithChildren<{ title: string; value: string; onChange: (value: string) => void }>) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.answerPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.answerTitle, { color: colors.text }]}>{title}</Text>
      <TextInput
        accessibilityLabel={title}
        autoFocus
        inputMode="numeric"
        keyboardType="numbers-and-punctuation"
        onChangeText={onChange}
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        selectTextOnFocus
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        value={value}
      />
      {children}
    </View>
  );
}

export function InlineFeedback({ correct, children }: PropsWithChildren<{ correct: boolean }>) {
  const { colors } = useAppTheme();
  return (
    <View accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: correct ? colors.successSurface : colors.dangerSurface }]}>
      <Text style={[styles.feedbackTitle, { color: correct ? colors.success : colors.danger }]}>{correct ? 'Correct' : 'Incorrect'}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  headerText: { flex: 1, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  right: { textAlign: 'right' },
  timer: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  stage: { minHeight: 260, marginTop: spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: radii.lg, backgroundColor: '#07573D', padding: spacing.lg },
  stageLabel: { marginBottom: spacing.lg, color: '#D7EFE5', fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  answerPanel: { marginTop: spacing.lg, borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg },
  answerTitle: { textAlign: 'center', fontSize: 23, fontWeight: '900' },
  input: { width: 132, minHeight: 64, alignSelf: 'center', marginVertical: spacing.lg, borderWidth: 1, borderRadius: radii.md, textAlign: 'center', fontSize: 30, fontWeight: '900' },
  feedback: { marginTop: spacing.md, borderRadius: radii.md, padding: spacing.md },
  feedbackTitle: { fontSize: 18, fontWeight: '900' },
});
