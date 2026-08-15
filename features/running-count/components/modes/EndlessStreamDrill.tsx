import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { spacing } from '@/constants/theme';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import { createEndlessCardStream, type EndlessCardStream } from '@/features/running-count/domain/endlessStream';
import { createRunningCountSessionSummary } from '@/features/running-count/domain/sessionSummary';
import type { CheckpointResult } from '@/features/running-count/types';
import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { getHiLoValue } from '@/lib/blackjack/hiLo';
import { useAppTheme } from '@/lib/useAppTheme';
import { useCardSoundPreference } from '@/hooks/useCardSoundPreference';

import { AnswerPanel, CardStage, DrillHeader, InlineFeedback, useCardRevealSound, useElapsedTime } from '../DrillUI';

function nextCheckpointDistance() {
  return 8 + Math.floor(Math.random() * 11);
}

export function EndlessStreamDrill() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, completeSession } = useRunningCount();
  const { cardSoundsEnabled } = useCardSoundPreference();
  const streamRef = useRef<EndlessCardStream | null>(null);
  if (!streamRef.current) streamRef.current = createEndlessCardStream(settings.deckCount);
  const firstCardRef = useRef<PlayingCardModel | null>(null);
  if (!firstCardRef.current) firstCardRef.current = streamRef.current.next();
  const [currentCard, setCurrentCard] = useState(firstCardRef.current);
  const [cardsSeen, setCardsSeen] = useState(1);
  const [phase, setPhase] = useState<'deal' | 'question' | 'feedback'>('deal');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<CheckpointResult | null>(null);
  const runningCountRef = useRef(getHiLoValue(firstCardRef.current));
  const nextCheckpointRef = useRef(nextCheckpointDistance());
  const checkpointStartedAtRef = useRef(Date.now());
  const resultsRef = useRef<CheckpointResult[]>([]);
  const startedAtRef = useRef(Date.now());
  const completedRef = useRef(false);
  const elapsedTimeMs = useElapsedTime(startedAtRef.current);
  useCardRevealSound(cardSoundsEnabled, cardsSeen);

  useEffect(() => {
    if (phase !== 'deal') return;
    const timer = setTimeout(() => {
      const card = streamRef.current!.next();
      const nextCardsSeen = cardsSeen + 1;
      runningCountRef.current += getHiLoValue(card);
      setCurrentCard(card);
      setCardsSeen(nextCardsSeen);
      if (nextCardsSeen >= nextCheckpointRef.current) {
        checkpointStartedAtRef.current = Date.now();
        setPhase('question');
      }
    }, settings.speedDealIntervalMs);
    return () => clearTimeout(timer);
  }, [cardsSeen, phase, settings.speedDealIntervalMs]);

  useEffect(() => {
    if (settings.endlessDurationSeconds !== 'endless'
      && elapsedTimeMs >= settings.endlessDurationSeconds * 1000
      && phase === 'deal') finish();
  }, [elapsedTimeMs, phase, settings.endlessDurationSeconds]);

  const submit = () => {
    if (!/^[-+]?\d+$/.test(answer.trim())) return;
    const userAnswer = Number(answer);
    const result: CheckpointResult = {
      cardPosition: cardsSeen,
      userAnswer,
      actualCount: runningCountRef.current,
      isCorrect: userAnswer === runningCountRef.current,
      responseTimeMs: Date.now() - checkpointStartedAtRef.current,
    };
    resultsRef.current = [...resultsRef.current, result];
    setFeedback(result);
    setPhase('feedback');
  };

  const continueStream = () => {
    nextCheckpointRef.current = cardsSeen + nextCheckpointDistance();
    setAnswer('');
    setFeedback(null);
    setPhase('deal');
  };

  function finish() {
    if (completedRef.current) return;
    completedRef.current = true;
    const elapsed = Date.now() - startedAtRef.current;
    const correct = resultsRef.current.filter((result) => result.isCorrect).length;
    let streak = 0;
    let longestCorrectStreak = 0;
    for (const result of resultsRef.current) {
      streak = result.isCorrect ? streak + 1 : 0;
      longestCorrectStreak = Math.max(longestCorrectStreak, streak);
    }
    const totalResponseTime = resultsRef.current.reduce((total, result) => total + result.responseTimeMs, 0);
    const attempts = resultsRef.current.length;
    const summary = createRunningCountSessionSummary({
      mode: 'endless', deckCount: settings.deckCount, attempts, correct,
      accuracyPercentage: attempts ? (correct / attempts) * 100 : 0,
      elapsedTimeMs: elapsed, totalCards: cardsSeen, cardsPerSecond: cardsSeen / (elapsed / 1000),
      checkpointResults: resultsRef.current,
      firstIncorrectCheckpoint: resultsRef.current.find((result) => !result.isCorrect)?.cardPosition,
      currentStreak: streak, longestCorrectStreak,
      averageResponseTimeMs: attempts ? totalResponseTime / attempts : 0,
      dealIntervalMs: settings.speedDealIntervalMs,
    });
    completeSession(summary);
    router.replace('/running-count/summary');
  }

  return (
    <Screen contentStyle={styles.content}>
      <DrillHeader elapsedTimeMs={elapsedTimeMs} progress={`${cardsSeen} cards`} secondary={`${settings.speedDealIntervalMs} ms`} />
      <CardStage cards={[currentCard]} label={phase === 'question' || phase === 'feedback' ? 'CHECKPOINT' : 'ENDLESS STREAM'} />

      {phase === 'question' ? (
        <AnswerPanel title="What is the running count now?" value={answer} onChange={setAnswer}>
          <AppButton label="Check count" onPress={submit} disabled={!/^[-+]?\d+$/.test(answer.trim())} />
        </AnswerPanel>
      ) : null}

      {phase === 'feedback' && feedback ? (
        <>
          <InlineFeedback correct={feedback.isCorrect}>
            <Text style={[styles.feedbackText, { color: colors.text }]}>Correct running count: {feedback.actualCount >= 0 ? '+' : ''}{feedback.actualCount}</Text>
          </InlineFeedback>
          <AppButton label="Continue stream" onPress={continueStream} style={styles.primary} />
        </>
      ) : null}

      <Text style={[styles.note, { color: colors.textMuted }]}>The stream reshuffles internally as needed; it is not presented as one finite casino shoe.</Text>
      <AppButton label="End session" variant="ghost" onPress={finish} style={styles.quit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  feedbackText: { marginTop: spacing.sm, fontSize: 16, fontWeight: '800' },
  primary: { marginTop: spacing.md },
  note: { marginTop: spacing.lg, textAlign: 'center', fontSize: 12, lineHeight: 17 },
  quit: { minHeight: 44, marginTop: spacing.md, paddingVertical: spacing.sm },
});
