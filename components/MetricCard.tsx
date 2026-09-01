import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/lib/useAppTheme';

interface MetricCardProps {
  label: string;
  value: string;
}

export function MetricCard({ label, value }: MetricCardProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 104,
    flexGrow: 1,
    flexBasis: '30%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  label: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '600',
  },
});
