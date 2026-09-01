import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { MetricCard } from '@/components/MetricCard';
import { Screen } from '@/components/Screen';
import { radii, spacing } from '@/constants/theme';
import { HAND_CATEGORY_LABELS } from '@/features/basic-strategy/constants';
import { useBasicStrategy } from '@/features/basic-strategy/context/BasicStrategyProvider';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';
import { useAppTheme } from '@/lib/useAppTheme';

export default function BasicStrategySummaryScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { lastSummary, settings, startSession } = useBasicStrategy();
  if (!lastSummary) return <Redirect href="/basic-strategy" />;

  const trainAgain = () => {
    startSession({ mode: lastSummary.mode, category: lastSummary.category, pattern: lastSummary.pattern }, settings);
    router.replace('/basic-strategy/drill');
  };

  return (
    <Screen contentStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colors.primary }]}>{lastSummary.rules} · SESSION COMPLETE</Text>
      <Text style={[styles.heading, { color: colors.text }]}>Session results</Text>
      <View style={styles.metrics}>
        <MetricCard label="Questions" value={String(lastSummary.attempted)} />
        <MetricCard label="Correct" value={String(lastSummary.correct)} />
        <MetricCard label="Accuracy" value={formatPercentage(lastSummary.accuracyPercentage)} />
        <MetricCard label="Best streak" value={String(lastSummary.bestStreak)} />
        <MetricCard label="Avg. time" value={formatResponseTime(lastSummary.averageResponseTimeMs)} />
        <MetricCard label="Automatic" value={formatPercentage(lastSummary.automaticPercentage)} />
      </View>

      {lastSummary.categoryPerformance.length ? <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.text }]}>By category</Text>{lastSummary.categoryPerformance.map((item) => <View key={item.category} style={[styles.row, { borderColor: colors.border }]}><Text style={[styles.rowName, { color: colors.text }]}>{HAND_CATEGORY_LABELS[item.category]}</Text><Text style={[styles.rowStats, { color: colors.textMuted }]}>{formatPercentage(item.accuracyPercentage)} · {formatResponseTime(item.averageResponseTimeMs)}</Text></View>)}</View> : null}

      {lastSummary.weakestHands.length ? <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.text }]}>Weakest hands</Text><View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>{lastSummary.weakestHands.map((item, index) => <View key={item.key} style={styles.weakRow}><Text style={[styles.rank, { color: colors.primary }]}>{index + 1}</Text><Text style={[styles.weakName, { color: colors.text }]}>{item.patternLabel} vs {item.dealerUpcardValue}</Text><Text style={[styles.rowStats, { color: colors.textMuted }]}>{formatPercentage(item.accuracyPercentage)} · {formatResponseTime(item.averageResponseTimeMs)}</Text></View>)}</View></View> : null}

      {lastSummary.weakestDealerUpcards.length ? <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.text }]}>Weakest dealer upcards</Text><View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>{lastSummary.weakestDealerUpcards.map((item, index) => <View key={item.key} style={styles.weakRow}><Text style={[styles.rank, { color: colors.primary }]}>{index + 1}</Text><Text style={[styles.weakName, { color: colors.text }]}>Dealer {item.dealerUpcardValue}</Text><Text style={[styles.rowStats, { color: colors.textMuted }]}>{formatPercentage(item.accuracyPercentage)} · {formatResponseTime(item.averageResponseTimeMs)}</Text></View>)}</View></View> : null}

      <View style={[styles.recommendation, { backgroundColor: colors.surfaceMuted }]}><Text style={[styles.recommendationLabel, { color: colors.primary }]}>NEXT STEPS</Text>{lastSummary.recommendations.map((recommendation) => <Text key={recommendation} style={[styles.recommendationText, { color: colors.text }]}>{recommendation}</Text>)}</View>

      <View style={styles.actions}><AppButton label="Train again" onPress={trainAgain} /><AppButton label="Choose another mode" onPress={() => router.replace('/basic-strategy')} variant="secondary" /><AppButton label="Back home" onPress={() => router.replace('/')} variant="ghost" /></View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  eyebrow: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  heading: { marginTop: spacing.sm, textAlign: 'center', fontSize: 34, fontWeight: '900' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl },
  section: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md, fontSize: 19, fontWeight: '900' },
  row: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  rowName: { flex: 1, fontSize: 15, fontWeight: '800' },
  rowStats: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  list: { borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md },
  weakRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rank: { width: 18, fontSize: 14, fontWeight: '900' },
  weakName: { flex: 1, fontSize: 14, fontWeight: '800' },
  recommendation: { marginTop: spacing.xl, borderRadius: radii.md, padding: spacing.md },
  recommendationLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  recommendationText: { marginTop: spacing.sm, fontSize: 15, lineHeight: 21, fontWeight: '700' },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
