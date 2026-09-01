import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { useTrueCount } from '@/features/true-count/context/TrueCountProvider';
import { createPatternCue } from '@/features/true-count/domain/patternRanges';
import { getResponseSpeedLabel } from '@/features/true-count/domain/responseSpeed';
import { formatSignedCount } from '@/features/true-count/domain/trueCount';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function TrueCountDrillScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { session, submitAnswer, nextQuestion, endSession, clearSession } = useTrueCount();

  if (!session) {
    return <Redirect href="/true-count" />;
  }

  const { currentQuestion, feedback, metrics, settings, hasReachedLimit } = session;
  const patternCue = feedback?.isCorrect
    ? null
    : createPatternCue(currentQuestion.runningCount, currentQuestion.decksRemaining);
  const quotient = Number((currentQuestion.runningCount / currentQuestion.decksRemaining).toFixed(2));
  const contextLabel =
    session.mode === 'pattern-recall'
      ? `STUDY · ${currentQuestion.decksRemaining} DECKS`
      : `${session.mode === 'adaptive' ? 'ADAPTIVE · ' : ''}${currentQuestion.shoeSize}-DECK SHOE`;
  const progressLabel =
    settings.sessionLength === 'endless'
      ? `${metrics.attempted} answered`
      : `${Math.min(metrics.attempted + (feedback ? 0 : 1), settings.sessionLength)} of ${settings.sessionLength}`;

  const finishSession = () => {
    const summary = endSession();
    if (summary) {
      router.replace('/true-count/summary');
    } else {
      clearSession();
      router.replace('/true-count');
    }
  };

  const handleContinue = () => {
    if (hasReachedLimit) {
      finishSession();
    } else {
      nextQuestion();
    }
  };

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={[styles.progress, { color: colors.textMuted }]}>{progressLabel}</Text>
        <Text style={[styles.streak, { color: colors.primary }]}>Streak {metrics.currentStreak}</Text>
      </View>

      <View style={styles.questionArea}>
        <Text style={[styles.shoe, { color: colors.textMuted }]}>{contextLabel}</Text>

        <View style={styles.factsRow}>
          <View style={styles.fact}>
            <Text style={[styles.factLabel, { color: colors.textMuted }]}>Running count</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{formatSignedCount(currentQuestion.runningCount)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.fact}>
            <Text style={[styles.factLabel, { color: colors.textMuted }]}>Decks remaining</Text>
            <Text style={[styles.factValue, { color: colors.text }]}>{currentQuestion.decksRemaining}</Text>
          </View>
        </View>

        <Text style={[styles.prompt, { color: colors.text }]}>True count?</Text>

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
                accessibilityRole="button"
                accessibilityLabel={`Answer ${formatSignedCount(answer)}`}
                disabled={Boolean(feedback)}
                key={answer}
                onPress={() => submitAnswer(answer)}
                style={({ pressed }) => [
                  styles.answer,
                  { backgroundColor, borderColor },
                  pressed && !feedback && { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <Text style={[styles.answerText, { color: textColor }]}>{formatSignedCount(answer)}</Text>
              </Pressable>
            );
          })}
        </View>

        {feedback ? (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.feedback,
              { backgroundColor: feedback.isCorrect ? colors.successSurface : colors.dangerSurface },
            ]}
          >
            <View style={styles.feedbackTitleRow}>
              <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? colors.success : colors.danger }]}>
                {feedback.isCorrect ? 'Correct' : 'Incorrect'}
              </Text>
              <Text style={[styles.responseTime, { color: colors.textMuted }]}>
                {getResponseSpeedLabel(feedback.responseSpeed)} · {formatResponseTime(feedback.responseTimeMs)}
              </Text>
            </View>
            {feedback.isCorrect ? (
              <Text style={[styles.calculation, { color: colors.text }]}>
                {formatSignedCount(currentQuestion.runningCount)} ÷ {currentQuestion.decksRemaining} →{' '}
                {formatSignedCount(feedback.correctAnswer)}
              </Text>
            ) : (
              <>
                <Text style={[styles.answerCorrection, { color: colors.text }]}>
                  Your answer {formatSignedCount(feedback.answer)} · Correct {formatSignedCount(feedback.correctAnswer)}
                </Text>
                <Text style={[styles.calculation, { color: colors.text }]}>
                  {formatSignedCount(currentQuestion.runningCount)} ÷ {currentQuestion.decksRemaining} ≈ {quotient}
                </Text>
                <Text style={[styles.truncation, { color: colors.text }]}>Truncate toward zero → {formatSignedCount(feedback.correctAnswer)}</Text>
                {patternCue ? (
                  <Text style={[styles.patternCue, { color: colors.textMuted }]}>
                    <Text style={styles.patternCueLabel}>Pattern cue: </Text>
                    {patternCue}
                  </Text>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.bottomArea}>
        {feedback ? (
          <AppButton label={hasReachedLimit ? 'View summary' : 'Next question'} onPress={handleContinue} />
        ) : (
          <View style={styles.liveMetrics}>
            <Text style={[styles.liveMetric, { color: colors.textMuted }]}>
              {formatPercentage(metrics.accuracyPercentage)} accuracy
            </Text>
            <Text style={[styles.liveMetric, { color: colors.textMuted }]}>Best {metrics.bestStreak}</Text>
          </View>
        )}
        <AppButton
          label={metrics.attempted > 0 ? 'End session' : 'Quit session'}
          onPress={finishSession}
          variant="ghost"
          style={styles.endButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    paddingTop: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progress: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  streak: {
    fontSize: 14,
    fontWeight: '800',
  },
  questionArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  shoe: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  factsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: spacing.lg,
  },
  fact: {
    flex: 1,
    alignItems: 'center',
  },
  factLabel: {
    minHeight: 36,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  factValue: {
    marginTop: spacing.xs,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
  },
  prompt: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
  },
  answers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  answer: {
    minWidth: 76,
    minHeight: 64,
    flexGrow: 1,
    flexBasis: '28%',
    maxWidth: 128,
    borderRadius: radii.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerText: {
    fontSize: 28,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  feedback: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  feedbackTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  responseTime: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  calculation: {
    marginTop: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  answerCorrection: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  truncation: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  patternCue: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 18,
  },
  patternCueLabel: {
    fontWeight: '900',
  },
  bottomArea: {
    paddingTop: spacing.sm,
  },
  liveMetrics: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  liveMetric: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  endButton: {
    minHeight: 44,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
