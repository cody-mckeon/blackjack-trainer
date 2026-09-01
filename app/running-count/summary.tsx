import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { MetricCard } from '@/components/MetricCard';
import { PlayingCard } from '@/components/PlayingCard';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { useRunningCount } from '@/features/running-count/context/RunningCountProvider';
import { getPersonalBestKey } from '@/features/running-count/domain/personalBests';
import { formatCard } from '@/lib/blackjack/cardTypes';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function RunningCountSummaryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { lastSummary, personalBests } = useRunningCount();
  if (!lastSummary) return <Redirect href="/running-count" />;
  const best = personalBests.find((record) => record.key === getPersonalBestKey(lastSummary));
  const firstError = lastSummary.firstIncorrectCheckpoint;

  return (
    <Screen>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>SESSION COMPLETE</Text>
      <Text style={[styles.heading, { color: colors.text }]}>{formatMode(lastSummary.mode)} · {lastSummary.deckCount} deck{lastSummary.deckCount === 1 ? '' : 's'}</Text>

      <View style={styles.metrics}>
        <MetricCard label="Accuracy" value={formatPercentage(lastSummary.accuracyPercentage)} />
        <MetricCard label="Time" value={formatResponseTime(lastSummary.elapsedTimeMs)} />
        {lastSummary.cardsPerSecond ? <MetricCard label="Cards / sec" value={lastSummary.cardsPerSecond.toFixed(2)} /> : null}
        {lastSummary.averageResponseTimeMs !== undefined ? <MetricCard label="Avg. response" value={formatResponseTime(lastSummary.averageResponseTimeMs)} /> : null}
        {lastSummary.longestCorrectStreak !== undefined ? <MetricCard label="Best streak" value={String(lastSummary.longestCorrectStreak)} /> : null}
      </View>

      {lastSummary.finalCountCorrect !== undefined ? (
        <View style={[styles.result, { backgroundColor: lastSummary.finalCountCorrect ? colors.successSurface : colors.dangerSurface }]}>
          <Text style={[styles.resultTitle, { color: lastSummary.finalCountCorrect ? colors.success : colors.danger }]}>{lastSummary.finalCountCorrect ? 'Correct final count' : 'Incorrect final count'}</Text>
          <Text style={[styles.resultText, { color: colors.text }]}>Your answer: {signed(lastSummary.finalUserAnswer ?? 0)} · Actual: {signed(lastSummary.actualFinalCount ?? 0)}</Text>
        </View>
      ) : null}

      {lastSummary.hiddenCard ? (
        <View style={[styles.hidden, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <PlayingCard card={lastSummary.hiddenCard} size="medium" />
          <View style={styles.hiddenCopy}>
            <Text style={[styles.resultTitle, { color: lastSummary.hiddenCategoryCorrect ? colors.success : colors.danger }]}>{lastSummary.hiddenCategoryCorrect ? 'Missing category correct' : 'Missing category incorrect'}</Text>
            <Text style={[styles.resultText, { color: colors.text }]}>Hidden card: {formatCard(lastSummary.hiddenCard)} ({lastSummary.hiddenCategoryActual})</Text>
          </View>
        </View>
      ) : null}

      {firstError ? <Text style={[styles.diagnostic, { color: colors.text }]}>First count error: Card {firstError}</Text> : null}
      {lastSummary.checkpointResults ? <Text style={[styles.diagnostic, { color: colors.text }]}>Checkpoint accuracy: {lastSummary.correct} / {lastSummary.attempts}</Text> : null}

      {best ? (
        <View style={[styles.best, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.bestTitle, { color: colors.text }]}>Personal record</Text>
          {best.bestValidTimeMs !== undefined ? <Text style={[styles.bestText, { color: colors.textMuted }]}>Best valid time {formatResponseTime(best.bestValidTimeMs)} · Average valid {formatResponseTime(best.averageValidTimeMs ?? best.bestValidTimeMs)}</Text> : null}
          {best.fastestSuccessfulDealMs !== undefined ? <Text style={[styles.bestText, { color: colors.textMuted }]}>Fastest successful speed {best.fastestSuccessfulDealMs} ms/card</Text> : null}
          <Text style={[styles.bestText, { color: colors.textMuted }]}>{best.successfulAttempts} successful of {best.attempts} attempts</Text>
        </View>
      ) : null}

      <View style={[styles.coaching, { borderColor: colors.primary }]}><Text style={[styles.coachingText, { color: colors.text }]}>{lastSummary.recommendation}</Text></View>
      <AppButton label="Train again" onPress={() => router.replace({ pathname: '/running-count/setup', params: { mode: lastSummary.mode } })} style={styles.action} />
      <AppButton label="Choose another mode" variant="secondary" onPress={() => router.replace('/running-count')} style={styles.secondary} />
      <AppButton label="Home" variant="ghost" onPress={() => router.replace('/')} style={styles.secondary} />
    </Screen>
  );
}

function signed(value: number) { return value > 0 ? `+${value}` : String(value); }
function formatMode(mode: string) { return mode.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '); }

const styles = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  heading: { marginTop: spacing.sm, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  result: { marginTop: spacing.lg, borderRadius: radii.md, padding: spacing.md },
  resultTitle: { fontSize: 18, fontWeight: '900' },
  resultText: { marginTop: spacing.xs, fontSize: 14, fontWeight: '700' },
  hidden: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, borderWidth: 1, borderRadius: radii.md, padding: spacing.md },
  hiddenCopy: { flex: 1 },
  diagnostic: { marginTop: spacing.md, fontSize: 16, fontWeight: '800' },
  best: { marginTop: spacing.lg, borderRadius: radii.md, padding: spacing.md },
  bestTitle: { fontSize: 16, fontWeight: '900' },
  bestText: { marginTop: spacing.xs, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  coaching: { marginTop: spacing.lg, borderLeftWidth: 4, borderRadius: radii.sm, padding: spacing.md },
  coachingText: { fontSize: 15, lineHeight: 22, fontWeight: '700' },
  action: { marginTop: spacing.xl },
  secondary: { marginTop: spacing.sm },
});
