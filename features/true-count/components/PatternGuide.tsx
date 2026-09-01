import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/lib/useAppTheme';

import { formatPatternRange, generatePatternRanges } from '../domain/patternRanges';

interface PatternGuideProps {
  decksRemaining: number;
}

export function PatternGuide({ decksRemaining }: PatternGuideProps) {
  const { colors } = useAppTheme();
  const ranges = generatePatternRanges(decksRemaining);
  const positive = ranges.filter((range) => range.trueCount > 0);
  const negative = ranges.filter((range) => range.trueCount < 0);

  return (
    <View style={[styles.guide, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{decksRemaining} decks landmarks</Text>
      <Text style={[styles.note, { color: colors.textMuted }]}>Recognize the range; don’t calculate every decimal.</Text>
      <View style={styles.columns}>
        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: colors.primary }]}>Positive</Text>
          {positive.map((range) => (
            <Text key={range.trueCount} style={[styles.range, { color: colors.text }]}>
              {formatPatternRange(range)}
            </Text>
          ))}
        </View>
        <View style={styles.column}>
          <Text style={[styles.columnTitle, { color: colors.primary }]}>Negative</Text>
          {negative.map((range) => (
            <Text key={range.trueCount} style={[styles.range, { color: colors.text }]}>
              {formatPatternRange(range)}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guide: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
  },
  note: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  column: {
    flex: 1,
  },
  columnTitle: {
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  range: {
    marginBottom: spacing.sm,
    fontSize: 13,
    lineHeight: 19,
    fontVariant: ['tabular-nums'],
  },
});
