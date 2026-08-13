import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { PlayingCard } from '@/components/PlayingCard';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { ACTION_LABELS } from '@/features/basic-strategy/constants';
import { useBasicStrategy } from '@/features/basic-strategy/context/BasicStrategyProvider';
import { RESPONSE_SPEED_LABELS } from '@/features/basic-strategy/domain/responseSpeed';
import type { BasicStrategyAction } from '@/features/basic-strategy/types';
import { useCardSounds } from '@/hooks/useCardSounds';
import { getHandClassification } from '@/lib/blackjack/handEvaluation';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function BasicStrategyDrillScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { session, submitAnswer, nextQuestion, endSession, clearSession } = useBasicStrategy();
  const { playDealSequence } = useCardSounds(session?.settings.cardSoundsEnabled ?? false);
  const questionId = session?.currentQuestion.id;

  useEffect(() => {
    if (questionId) playDealSequence(3);
  }, [questionId, playDealSequence]);

  if (!session) return <Redirect href="/basic-strategy" />;

  const { currentQuestion, feedback, metrics, settings, hasReachedLimit } = session;
  const progress = settings.sessionLength === 'endless'
    ? `${metrics.attempted} answered`
    : `${Math.min(metrics.attempted + (feedback ? 0 : 1), settings.sessionLength)} of ${settings.sessionLength}`;
  const totalVisible = settings.handTotalDisplay === 'before' && !feedback;
  const totalText = getHandClassification(currentQuestion.playerCards);
  const decision = currentQuestion.strategyFeedback;

  const finish = () => {
    const summary = endSession();
    if (summary) router.replace('/basic-strategy/summary');
    else { clearSession(); router.replace('/basic-strategy'); }
  };
  const continueDrill = () => hasReachedLimit ? finish() : nextQuestion();

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={[styles.progress, { color: colors.textMuted }]}>{progress}</Text>
        <View style={[styles.rulesBadge, { backgroundColor: colors.primary }]}><Text style={[styles.rulesText, { color: colors.onPrimary }]}>{settings.rules} Rules</Text></View>
        <Text style={[styles.streak, { color: colors.primary }]}>Streak {metrics.currentStreak}</Text>
      </View>

      <View style={[styles.table, { borderColor: colors.border }]}> 
        <View style={styles.dealerArea}>
          <Text style={styles.tableLabel}>DEALER</Text>
          <PlayingCard card={currentQuestion.dealerUpcard} size="medium" />
        </View>
        <View style={styles.feltLine} />
        <View style={styles.playerArea}>
          <Text style={styles.tableLabel}>YOUR HAND</Text>
          <View style={styles.cards}>
            {currentQuestion.playerCards.map((card, index) => <PlayingCard key={`${card.rank}-${card.suit}-${index}`} card={card} size="large" />)}
          </View>
          {totalVisible ? <Text style={styles.handTotal}>{totalText}</Text> : <View style={styles.totalPlaceholder} />}
        </View>
      </View>

      <View style={styles.actions}>
        {currentQuestion.availableActions.map((action) => {
          const isCorrect = feedback?.correctAction === action;
          const isWrong = feedback?.answer === action && !feedback.isCorrect;
          return (
            <Pressable
              accessibilityRole="button"
              disabled={Boolean(feedback)}
              key={action}
              onPress={() => submitAnswer(action)}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: isCorrect ? colors.successSurface : isWrong ? colors.dangerSurface : colors.surface, borderColor: isCorrect ? colors.success : isWrong ? colors.danger : colors.border },
                pressed && !feedback && { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Text style={[styles.actionText, { color: isCorrect ? colors.success : isWrong ? colors.danger : colors.text }]}>{ACTION_LABELS[action]}</Text>
            </Pressable>
          );
        })}
      </View>

      {feedback ? (
        <View accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: feedback.isCorrect ? colors.successSurface : colors.dangerSurface }]}> 
          <View style={styles.feedbackHeader}>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? colors.success : colors.danger }]}>{feedback.isCorrect ? 'Correct' : 'Incorrect'}</Text>
            <Text style={[styles.speed, { color: colors.textMuted }]}>{RESPONSE_SPEED_LABELS[feedback.responseSpeed]} · {formatResponseTime(feedback.responseTimeMs)}</Text>
          </View>
          <Text style={[styles.classification, { color: colors.text }]}>{decision.handClassification}</Text>
          <Text style={[styles.correctPlay, { color: colors.text }]}>Correct play: {ACTION_LABELS[feedback.correctAction]}</Text>
          <Text style={[styles.pattern, { color: colors.textMuted }]}>{decision.patternExplanation}</Text>
          {decision.ruleCaveat ? <Text style={[styles.caveat, { color: colors.textMuted }]}>{decision.ruleCaveat}</Text> : null}
        </View>
      ) : (
        <View style={styles.liveMetrics}><Text style={[styles.liveMetric, { color: colors.textMuted }]}>{formatPercentage(metrics.accuracyPercentage)} accuracy</Text><Text style={[styles.liveMetric, { color: colors.textMuted }]}>Best {metrics.bestStreak}</Text></View>
      )}

      {feedback ? <AppButton label={hasReachedLimit ? 'View summary' : 'Next hand'} onPress={continueDrill} style={styles.next} /> : null}
      <AppButton label={metrics.attempted ? 'End session' : 'Quit session'} onPress={finish} variant="ghost" style={styles.end} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.sm },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  progress: { flex: 1, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rulesBadge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rulesText: { fontSize: 12, fontWeight: '900' },
  streak: { flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  table: { marginTop: spacing.md, overflow: 'hidden', borderWidth: 1, borderRadius: radii.lg, backgroundColor: '#07573D', padding: spacing.md, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, elevation: 4 },
  dealerArea: { alignItems: 'center' },
  playerArea: { alignItems: 'center', paddingTop: spacing.sm },
  tableLabel: { marginBottom: spacing.sm, color: '#D7EFE5', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  feltLine: { height: 1, marginVertical: spacing.sm, backgroundColor: 'rgba(255,255,255,0.18)' },
  cards: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  handTotal: { minHeight: 22, marginTop: spacing.sm, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  totalPlaceholder: { height: 22, marginTop: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  action: { minHeight: 54, flexGrow: 1, flexBasis: '28%', maxWidth: 180, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: radii.md, paddingHorizontal: spacing.sm },
  actionText: { fontSize: 16, fontWeight: '900' },
  feedback: { marginTop: spacing.md, borderRadius: radii.md, padding: spacing.md },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  feedbackTitle: { fontSize: 18, fontWeight: '900' },
  speed: { fontSize: 13, fontWeight: '700' },
  classification: { marginTop: spacing.sm, fontSize: 14, fontWeight: '700' },
  correctPlay: { marginTop: spacing.xs, fontSize: 16, fontWeight: '900' },
  pattern: { marginTop: spacing.sm, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  caveat: { marginTop: spacing.xs, fontSize: 12, lineHeight: 17, fontStyle: 'italic' },
  liveMetrics: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  liveMetric: { fontSize: 13, fontWeight: '700' },
  next: { marginTop: spacing.md },
  end: { minHeight: 44, marginTop: spacing.sm, paddingVertical: spacing.sm },
});
