import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { MetricCard } from '@/components/MetricCard';
import { Screen } from '@/components/Screen';
import { TrainingModeCard } from '@/components/TrainingModeCard';
import { spacing } from '@/constants/theme';
import { useTrueCount } from '@/features/true-count/context/TrueCountProvider';
import { useAppTheme } from '@/lib/useAppTheme';
import { formatPercentage, formatResponseTime } from '@/lib/formatters';

const COMING_SOON_MODES = [
  ['Running Count', 'Build speed and accuracy through a full shoe.'],
  ['Basic Strategy', 'Practice the correct play for every hand.'],
  ['Casino Simulation', 'Combine decisions in realistic rounds.'],
  ['Deviations', 'Train index plays from the true count.'],
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { isLoading, recentSessions } = useTrueCount();
  const latestSession = recentSessions[0];

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>TRAIN SMARTER</Text>
        <Text style={[styles.title, { color: colors.text }]}>Blackjack Trainer</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Fast, focused drills for accurate decisions.</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : latestSession ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest session</Text>
          <View style={styles.metricRow}>
            <MetricCard label="Accuracy" value={formatPercentage(latestSession.accuracyPercentage)} />
            <MetricCard label="Best streak" value={String(latestSession.bestStreak)} />
            <MetricCard label="Avg. time" value={formatResponseTime(latestSession.averageResponseTimeMs)} />
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Training modes</Text>
        <View style={styles.modeList}>
          <TrainingModeCard
            title="True Count Trainer"
            description="Convert running counts using decks remaining."
            enabled
            onPress={() => router.push('/true-count')}
          />
          {COMING_SOON_MODES.map(([title, description]) => (
            <TrainingModeCard key={title} title={title} description={description} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.xxl,
  },
  hero: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  title: {
    marginTop: spacing.sm,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: 17,
    lineHeight: 25,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontSize: 20,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  modeList: {
    gap: spacing.md,
  },
});
