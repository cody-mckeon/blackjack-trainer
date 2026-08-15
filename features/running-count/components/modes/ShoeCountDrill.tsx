import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import { createRunningCountSessionSummary } from '@/features/running-count/domain/sessionSummary';
import type { RunningCountMode } from '@/features/running-count/types';
import { calculateRunningCount, getHiLoCategory, type HiLoCategory } from '@/lib/blackjack/hiLo';
import { generateShuffledShoe, removeHiddenCard } from '@/lib/blackjack/shoe';
import { useAppTheme } from '@/lib/useAppTheme';
import { useCardSoundPreference } from '@/hooks/useCardSoundPreference';

import { AnswerPanel, CardStage, DrillHeader, useCardRevealSound, useElapsedTime } from '../DrillUI';

type ShoeMode = Extract<RunningCountMode, 'countdown' | 'hidden-card' | 'speed'>;

export function ShoeCountDrill({ mode }: { mode: ShoeMode }) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, completeSession } = useRunningCount();
  const { cardSoundsEnabled } = useCardSoundPreference();
  const initialRef = useRef<ReturnType<typeof createShoeSession> | null>(null);
  if (!initialRef.current) initialRef.current = createShoeSession(mode, settings.deckCount);
  const { cards, hiddenCard } = initialRef.current;
  const startedAtRef = useRef(Date.now());
  const answerStartedAtRef = useRef(startedAtRef.current);
  const [cardIndex, setCardIndex] = useState(0);
  const [phase, setPhase] = useState<'deal' | 'count-answer' | 'category-answer'>('deal');
  const [countAnswer, setCountAnswer] = useState('');
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);
  const elapsedTimeMs = useElapsedTime(startedAtRef.current, true);
  useCardRevealSound(cardSoundsEnabled, cardIndex);

  const isAuto = mode === 'speed' || (mode === 'countdown' && settings.countdownDealStyle === 'auto');
  const dealIntervalMs = mode === 'speed' ? settings.speedDealIntervalMs : settings.autoDealIntervalMs;
  const beginAnswer = () => {
    answerStartedAtRef.current = Date.now();
    setPhase('count-answer');
  };

  useEffect(() => {
    if (!isAuto || phase !== 'deal') return;
    const timer = setTimeout(() => {
      if (cardIndex >= cards.length - 1) beginAnswer();
      else setCardIndex((index) => index + 1);
    }, dealIntervalMs);
    return () => clearTimeout(timer);
  }, [cardIndex, cards.length, dealIntervalMs, isAuto, phase]);

  const advance = () => {
    if (cardIndex >= cards.length - 1) beginAnswer();
    else setCardIndex((index) => index + 1);
  };

  const submitCount = () => {
    if (!/^[-+]?\d+$/.test(countAnswer.trim())) return;
    const answer = Number(countAnswer);
    if (mode === 'hidden-card') {
      setSubmittedCount(answer);
      setPhase('category-answer');
      return;
    }
    finish(answer);
  };

  const finish = (answer: number, categoryAnswer?: HiLoCategory) => {
    const elapsed = Date.now() - startedAtRef.current;
    const actualFinalCount = calculateRunningCount(cards);
    const finalCountCorrect = answer === actualFinalCount;
    const hiddenCategoryActual = hiddenCard ? getHiLoCategory(hiddenCard) : undefined;
    const hiddenCategoryCorrect = categoryAnswer ? categoryAnswer === hiddenCategoryActual : undefined;
    const attempts = mode === 'hidden-card' ? 2 : 1;
    const correct = Number(finalCountCorrect) + Number(hiddenCategoryCorrect ?? false);
    const summary = createRunningCountSessionSummary({
      mode,
      deckCount: settings.deckCount,
      attempts,
      correct,
      accuracyPercentage: (correct / attempts) * 100,
      elapsedTimeMs: elapsed,
      totalCards: cards.length,
      cardsPerSecond: cards.length / (elapsed / 1000),
      averageResponseTimeMs: Date.now() - answerStartedAtRef.current,
      finalUserAnswer: answer,
      actualFinalCount,
      finalCountCorrect,
      currentStreak: finalCountCorrect && (mode !== 'hidden-card' || hiddenCategoryCorrect) ? 1 : 0,
      longestCorrectStreak: finalCountCorrect && (mode !== 'hidden-card' || hiddenCategoryCorrect) ? 1 : 0,
      hiddenCategoryAnswer: categoryAnswer,
      hiddenCategoryActual,
      hiddenCategoryCorrect,
      hiddenCard,
      dealIntervalMs: mode === 'speed' ? settings.speedDealIntervalMs : undefined,
    });
    completeSession(summary);
    router.replace('/running-count/summary');
  };

  return (
    <Screen contentStyle={styles.content}>
      <DrillHeader
        elapsedTimeMs={elapsedTimeMs}
        progress={`${Math.min(cardIndex + 1, cards.length)} / ${cards.length}`}
        secondary={mode === 'speed' ? `${settings.speedDealIntervalMs} ms` : `${settings.deckCount} deck${settings.deckCount === 1 ? '' : 's'}`}
      />
      <CardStage cards={[cards[cardIndex]]} label={phase === 'deal' ? 'KEEP THE COUNT' : 'SHOE COMPLETE'} />

      {phase === 'deal' && !isAuto ? <AppButton label="Next Card" onPress={advance} style={styles.primary} /> : null}
      {phase === 'deal' && isAuto ? <Text style={[styles.autoNote, { color: colors.textMuted }]}>Cards deal automatically. Stay with the rhythm.</Text> : null}

      {phase === 'count-answer' ? (
        <AnswerPanel title="Final Running Count?" value={countAnswer} onChange={setCountAnswer}>
          <AppButton label={mode === 'hidden-card' ? 'Continue' : 'Check count'} onPress={submitCount} disabled={!/^[-+]?\d+$/.test(countAnswer.trim())} />
        </AnswerPanel>
      ) : null}

      {phase === 'category-answer' && submittedCount !== null ? (
        <View style={[styles.categoryPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>Which card category is missing?</Text>
          <Text style={[styles.categoryHint, { color: colors.textMuted }]}>Final running count submitted: {submittedCount >= 0 ? '+' : ''}{submittedCount}</Text>
          <View style={styles.choices}>
            {([
              ['low', 'Low card (2–6)'],
              ['neutral', 'Neutral card (7–9)'],
              ['high', 'High card (10–Ace)'],
            ] as const).map(([value, label]) => (
              <Pressable key={value} onPress={() => finish(submittedCount, value)} style={[styles.choice, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.choiceText, { color: colors.text }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <AppButton label="Quit drill" variant="ghost" onPress={() => router.replace('/running-count')} style={styles.quit} />
    </Screen>
  );
}

function createShoeSession(mode: ShoeMode, deckCount: Parameters<typeof generateShuffledShoe>[0]) {
  const shuffled = generateShuffledShoe(deckCount);
  if (mode !== 'hidden-card') return { cards: shuffled, hiddenCard: undefined };
  const hidden = removeHiddenCard(shuffled);
  return { cards: hidden.remainingCards, hiddenCard: hidden.hiddenCard };
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  primary: { marginTop: spacing.lg },
  autoNote: { marginTop: spacing.lg, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  categoryPanel: { marginTop: spacing.lg, borderWidth: 1, borderRadius: radii.lg, padding: spacing.lg },
  categoryTitle: { textAlign: 'center', fontSize: 22, fontWeight: '900' },
  categoryHint: { marginTop: spacing.sm, textAlign: 'center', fontSize: 14, fontWeight: '700' },
  choices: { gap: spacing.sm, marginTop: spacing.lg },
  choice: { minHeight: 54, justifyContent: 'center', borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md },
  choiceText: { textAlign: 'center', fontSize: 16, fontWeight: '800' },
  quit: { minHeight: 44, marginTop: spacing.md, paddingVertical: spacing.sm },
});
