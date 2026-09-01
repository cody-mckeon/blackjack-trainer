import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { CANCELLATION_QUESTIONS_PER_SESSION } from '@/features/running-count/constants';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import { createCancellationChunk, type CancellationChunk } from '@/features/running-count/domain/cancellation';
import { createRunningCountSessionSummary } from '@/features/running-count/domain/sessionSummary';
import { useAppTheme } from '@/lib/useAppTheme';
import { useCardSoundPreference } from '@/hooks/useCardSoundPreference';

import { CardStage, DrillHeader, InlineFeedback, useCardRevealSound, useElapsedTime } from '../DrillUI';

interface CancellationResult {
  isCorrect: boolean;
  responseTimeMs: number;
  type: string;
}

export function CancellationDrill() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, completeSession } = useRunningCount();
  const { cardSoundsEnabled } = useCardSoundPreference();
  const [chunk, setChunk] = useState<CancellationChunk>(() => createCancellationChunk(settings.cancellationChunkSize, settings.deckCount));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ answer: number; correct: boolean } | null>(null);
  const startedAtRef = useRef(Date.now());
  const questionStartedAtRef = useRef(startedAtRef.current);
  const resultsRef = useRef<CancellationResult[]>([]);
  const elapsedTimeMs = useElapsedTime(startedAtRef.current);
  useCardRevealSound(cardSoundsEnabled, questionIndex, chunk.cards.length);

  const submit = (answer: number) => {
    if (feedback) return;
    const correct = answer === chunk.netValue;
    resultsRef.current = [...resultsRef.current, {
      isCorrect: correct,
      responseTimeMs: Date.now() - questionStartedAtRef.current,
      type: chunk.type,
    }];
    setFeedback({ answer, correct });
  };

  const finish = () => {
    const elapsed = Date.now() - startedAtRef.current;
    const correct = resultsRef.current.filter((result) => result.isCorrect).length;
    const errorTypes = resultsRef.current.reduce<Record<string, number>>((errors, result) => {
      if (!result.isCorrect) errors[result.type] = (errors[result.type] ?? 0) + 1;
      return errors;
    }, {});
    let streak = 0;
    let longestCorrectStreak = 0;
    for (const result of resultsRef.current) {
      streak = result.isCorrect ? streak + 1 : 0;
      longestCorrectStreak = Math.max(longestCorrectStreak, streak);
    }
    const responseTotal = resultsRef.current.reduce((total, result) => total + result.responseTimeMs, 0);
    const summary = createRunningCountSessionSummary({
      mode: 'cancellation', deckCount: settings.deckCount,
      attempts: resultsRef.current.length, correct,
      accuracyPercentage: (correct / resultsRef.current.length) * 100,
      elapsedTimeMs: elapsed, totalCards: resultsRef.current.length * settings.cancellationChunkSize,
      averageResponseTimeMs: responseTotal / resultsRef.current.length,
      currentStreak: streak, longestCorrectStreak, errorTypes,
    });
    completeSession(summary);
    router.replace('/running-count/summary');
  };

  const next = () => {
    if (resultsRef.current.length >= CANCELLATION_QUESTIONS_PER_SESSION) {
      finish();
      return;
    }
    setQuestionIndex((index) => index + 1);
    setChunk(createCancellationChunk(settings.cancellationChunkSize, settings.deckCount));
    setFeedback(null);
    questionStartedAtRef.current = Date.now();
  };

  const correctSoFar = resultsRef.current.filter((result) => result.isCorrect).length;
  return (
    <Screen contentStyle={styles.content}>
      <DrillHeader elapsedTimeMs={elapsedTimeMs} progress={`${questionIndex + 1} / ${CANCELLATION_QUESTIONS_PER_SESSION}`} secondary={`${correctSoFar}/${resultsRef.current.length} correct`} />
      <CardStage cards={chunk.cards} label="NET HI-LO VALUE?" />

      <View style={styles.answers}>
        {[-2, -1, 0, 1, 2].map((answer) => {
          const correctChoice = feedback && answer === chunk.netValue;
          const wrongChoice = feedback && answer === feedback.answer && !feedback.correct;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(feedback)}
              key={answer}
              onPress={() => submit(answer)}
              style={({ pressed }) => [
                styles.answer,
                { backgroundColor: correctChoice ? colors.successSurface : wrongChoice ? colors.dangerSurface : colors.surface, borderColor: correctChoice ? colors.success : wrongChoice ? colors.danger : colors.border },
                pressed && !feedback && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.answerText, { color: colors.text }]}>{answer > 0 ? '+' : ''}{answer}</Text>
            </Pressable>
          );
        })}
      </View>

      {feedback ? (
        <>
          <InlineFeedback correct={feedback.correct}>
            <Text style={[styles.explanation, { color: colors.text }]}>Net value: {chunk.netValue > 0 ? '+' : ''}{chunk.netValue}</Text>
          </InlineFeedback>
          <AppButton label={resultsRef.current.length >= CANCELLATION_QUESTIONS_PER_SESSION ? 'View summary' : 'Next group'} onPress={next} style={styles.next} />
        </>
      ) : null}
      <AppButton label="Quit drill" variant="ghost" onPress={() => router.replace('/running-count')} style={styles.quit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  answers: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  answer: { width: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: radii.md },
  answerText: { fontSize: 19, fontWeight: '900' },
  explanation: { marginTop: spacing.sm, fontSize: 16, fontWeight: '800' },
  next: { marginTop: spacing.md },
  quit: { minHeight: 44, marginTop: spacing.md, paddingVertical: spacing.sm },
});
