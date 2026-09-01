import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import { generateCheckpointPositions, getRunningCountAtCheckpoint, summarizeCheckpointResults } from '@/features/running-count/domain/checkpoints';
import { createRunningCountSessionSummary } from '@/features/running-count/domain/sessionSummary';
import type { CheckpointResult } from '@/features/running-count/types';
import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { generateShuffledShoe } from '@/lib/blackjack/shoe';
import { useAppTheme } from '@/lib/useAppTheme';
import { useCardSoundPreference } from '@/hooks/useCardSoundPreference';

import { AnswerPanel, CardStage, DrillHeader, InlineFeedback, useCardRevealSound, useElapsedTime } from '../DrillUI';

export function CheckpointDrill() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, completeSession } = useRunningCount();
  const { cardSoundsEnabled } = useCardSoundPreference();
  const cardsRef = useRef<PlayingCardModel[] | null>(null);
  if (!cardsRef.current) cardsRef.current = generateShuffledShoe(settings.deckCount);
  const checkpointsRef = useRef<number[] | null>(null);
  if (!checkpointsRef.current) checkpointsRef.current = generateCheckpointPositions(cardsRef.current.length, settings.checkpointFrequency);
  const startedAtRef = useRef(Date.now());
  const checkpointStartedAtRef = useRef(startedAtRef.current);
  const [cardIndex, setCardIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<CheckpointResult | null>(null);
  const resultsRef = useRef<CheckpointResult[]>([]);
  const elapsedTimeMs = useElapsedTime(startedAtRef.current);
  const cards = cardsRef.current;
  const revealedCount = cardIndex + 1;
  const atCheckpoint = checkpointsRef.current.includes(revealedCount);
  useCardRevealSound(cardSoundsEnabled, cardIndex);

  useEffect(() => {
    if (atCheckpoint) checkpointStartedAtRef.current = Date.now();
  }, [atCheckpoint, revealedCount]);

  const submit = () => {
    if (!/^[-+]?\d+$/.test(answer.trim()) || feedback) return;
    const userAnswer = Number(answer);
    const actualCount = getRunningCountAtCheckpoint(cards, revealedCount);
    const result: CheckpointResult = {
      cardPosition: revealedCount,
      userAnswer,
      actualCount,
      isCorrect: userAnswer === actualCount,
      responseTimeMs: Date.now() - checkpointStartedAtRef.current,
    };
    resultsRef.current = [...resultsRef.current, result];
    setFeedback(result);
  };

  const continueAfterCheckpoint = () => {
    setFeedback(null);
    setAnswer('');
    setCardIndex((index) => index + 1);
  };

  const finish = () => {
    const elapsed = Date.now() - startedAtRef.current;
    const diagnostics = summarizeCheckpointResults(resultsRef.current);
    const responseTotal = resultsRef.current.reduce((total, result) => total + result.responseTimeMs, 0);
    const attempts = resultsRef.current.length;
    const summary = createRunningCountSessionSummary({
      mode: 'checkpoint', deckCount: settings.deckCount, attempts, correct: diagnostics.correct,
      accuracyPercentage: attempts ? (diagnostics.correct / attempts) * 100 : 0,
      elapsedTimeMs: elapsed, totalCards: cards.length, cardsPerSecond: cards.length / (elapsed / 1000),
      checkpointResults: resultsRef.current,
      firstIncorrectCheckpoint: diagnostics.firstIncorrectCheckpoint,
      longestCorrectStreak: diagnostics.longestCorrectStreak,
      currentStreak: diagnostics.currentStreak,
      averageResponseTimeMs: attempts ? responseTotal / attempts : 0,
    });
    completeSession(summary);
    router.replace('/running-count/summary');
  };

  const advance = () => cardIndex >= cards.length - 1 ? finish() : setCardIndex((index) => index + 1);

  return (
    <Screen contentStyle={styles.content}>
      <DrillHeader elapsedTimeMs={elapsedTimeMs} progress={`${revealedCount} / ${cards.length}`} secondary={`${resultsRef.current.filter((result) => result.isCorrect).length}/${resultsRef.current.length} checks`} />
      <CardStage cards={[cards[cardIndex]]} label={atCheckpoint ? 'CHECKPOINT' : 'KEEP THE COUNT'} />

      {atCheckpoint && !feedback ? (
        <AnswerPanel title="What is the running count now?" value={answer} onChange={setAnswer}>
          <AppButton label="Check count" onPress={submit} disabled={!/^[-+]?\d+$/.test(answer.trim())} />
        </AnswerPanel>
      ) : null}

      {feedback ? (
        <>
          <InlineFeedback correct={feedback.isCorrect}>
            <Text style={[styles.feedbackText, { color: colors.text }]}>Correct running count: {feedback.actualCount >= 0 ? '+' : ''}{feedback.actualCount}</Text>
            <Text style={[styles.feedbackHint, { color: colors.textMuted }]}>Reset to this count, then continue.</Text>
          </InlineFeedback>
          <AppButton label="Continue" onPress={continueAfterCheckpoint} style={styles.primary} />
        </>
      ) : null}

      {!atCheckpoint ? <AppButton label={cardIndex === cards.length - 1 ? 'Finish shoe' : 'Next Card'} onPress={advance} style={styles.primary} /> : null}
      <AppButton label="Quit drill" variant="ghost" onPress={() => router.replace('/running-count')} style={styles.quit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  primary: { marginTop: spacing.lg },
  feedbackText: { marginTop: spacing.sm, fontSize: 16, fontWeight: '800' },
  feedbackHint: { marginTop: spacing.xs, fontSize: 13, fontWeight: '600' },
  quit: { minHeight: 44, marginTop: spacing.md, paddingVertical: spacing.sm },
});
