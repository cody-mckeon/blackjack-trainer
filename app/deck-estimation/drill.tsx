import { useCallback } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { DiscardTrayPhoto } from '@/components/DiscardTrayPhoto';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { useDeckEstimation } from '@/features/deck-estimation/context/DeckEstimationProvider';
import { getDeckEstimationResponseSpeedLabel } from '@/features/deck-estimation/domain/responseSpeed';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function DeckEstimationDrillScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const {
    session,
    markQuestionVisible,
    submitAnswer,
    nextQuestion,
    endSession,
    clearSession,
  } = useDeckEstimation();
  const questionId = session?.currentQuestion.id;
  const handleVisualReady = useCallback(() => {
    if (questionId) markQuestionVisible(questionId);
  }, [markQuestionVisible, questionId]);

  if (!session) return <Redirect href="/deck-estimation" />;

  const { currentQuestion, feedback, metrics, settings, hasReachedLimit } = session;
  const progressLabel = settings.sessionLength === 'endless'
    ? `${metrics.attempted} answered`
    : `${Math.min(metrics.attempted + (feedback ? 0 : 1), settings.sessionLength)} of ${settings.sessionLength}`;

  const finishSession = () => {
    const summary = endSession();
    if (summary) router.replace('/deck-estimation/summary');
    else {
      clearSession();
      router.replace('/deck-estimation');
    }
  };

  const handleContinue = () => {
    if (hasReachedLimit) finishSession();
    else nextQuestion();
  };

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={[styles.progress, { color: colors.textMuted }]}>{progressLabel}</Text>
        <Text style={[styles.streak, { color: colors.primary }]}>Streak {metrics.currentStreak}</Text>
      </View>

      <Text style={[styles.shoe, { color: colors.primary }]}>{currentQuestion.startingDecks}-DECK SHOE</Text>
      <DiscardTrayPhoto
        discardedCardCount={currentQuestion.discardedCardCount}
        startingDeckCount={currentQuestion.startingDecks}
        fallbackVariation={currentQuestion.visualVariation}
        onVisualReady={handleVisualReady}
      />
      <Text style={[styles.prompt, { color: colors.text }]}>How many decks remain?</Text>

      <View style={styles.answers}>
        {currentQuestion.answerChoices.map((answer) => {
          const isCorrectAnswer = feedback?.correctAnswer === answer;
          const isSelectedWrong = feedback?.answer === answer && !feedback.isCorrect;
          const backgroundColor = isCorrectAnswer
            ? colors.successSurface
            : isSelectedWrong
              ? colors.dangerSurface
              : colors.surface;
          const borderColor = isCorrectAnswer
            ? colors.success
            : isSelectedWrong
              ? colors.danger
              : colors.border;
          const textColor = isCorrectAnswer
            ? colors.success
            : isSelectedWrong
              ? colors.danger
              : colors.text;
          return (
            <Pressable
              accessibilityLabel={`${answer} decks remaining`}
              accessibilityRole="button"
              disabled={Boolean(feedback)}
              key={answer}
              onPress={() => submitAnswer(answer)}
              style={({ pressed }) => [
                styles.answer,
                { backgroundColor, borderColor },
                pressed && !feedback && { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Text style={[styles.answerText, { color: textColor }]}>{answer}</Text>
            </Pressable>
          );
        })}
      </View>

      {feedback ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.feedback, { backgroundColor: feedback.isCorrect ? colors.successSurface : colors.dangerSurface }]}
        >
          <View style={styles.feedbackTitleRow}>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? colors.success : colors.danger }]}>
              {feedback.isCorrect ? 'Correct' : 'Incorrect'}
            </Text>
            <Text style={[styles.responseTime, { color: colors.textMuted }]}>
              {getDeckEstimationResponseSpeedLabel(feedback.responseSpeed)} · {formatResponseTime(feedback.responseTimeMs)}
            </Text>
          </View>
          <Text style={[styles.correctAnswer, { color: colors.text }]}>
            {feedback.isCorrect ? `${feedback.correctAnswer} decks remain` : `Correct answer: ${feedback.correctAnswer} decks remaining`}
          </Text>
          <Text style={[styles.detail, { color: colors.textMuted }]}>
            {currentQuestion.decksPlayed} {currentQuestion.decksPlayed === 1 ? 'deck' : 'decks'} played · ≈{currentQuestion.discardedCardCount} cards discarded
          </Text>
          {!feedback.isCorrect ? (
            <Text style={[styles.cue, { color: colors.textMuted }]}>Compare this stack with the nearest landmark in Calibration.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.liveMetrics}>
          <Text style={[styles.liveMetric, { color: colors.textMuted }]}>{formatPercentage(metrics.accuracyPercentage)} accuracy</Text>
          <Text style={[styles.liveMetric, { color: colors.textMuted }]}>Best {metrics.bestStreak}</Text>
        </View>
      )}

      {feedback ? (
        <AppButton label={hasReachedLimit ? 'View summary' : 'Next question'} onPress={handleContinue} style={styles.primaryAction} />
      ) : null}
      <AppButton
        label={metrics.attempted > 0 ? 'End session' : 'Quit session'}
        onPress={finishSession}
        variant="ghost"
        style={styles.endButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.md, paddingBottom: spacing.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  streak: { fontSize: 14, fontWeight: '800' },
  shoe: { marginTop: spacing.md, textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  prompt: { textAlign: 'center', fontSize: 23, fontWeight: '900' },
  answers: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  answer: {
    minWidth: 76,
    minHeight: 60,
    flexGrow: 1,
    flexBasis: '28%',
    maxWidth: 132,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: { fontSize: 27, fontWeight: '900', fontVariant: ['tabular-nums'] },
  feedback: { marginTop: spacing.md, borderRadius: radii.md, padding: spacing.md },
  feedbackTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  feedbackTitle: { fontSize: 18, fontWeight: '900' },
  responseTime: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  correctAnswer: { marginTop: spacing.sm, fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  detail: { marginTop: spacing.xs, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cue: { marginTop: spacing.sm, fontSize: 13, lineHeight: 18 },
  liveMetrics: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  liveMetric: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  primaryAction: { marginTop: spacing.md },
  endButton: { minHeight: 44, marginTop: spacing.sm, paddingVertical: spacing.sm },
});
