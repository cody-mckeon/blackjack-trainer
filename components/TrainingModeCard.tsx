import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/lib/useAppTheme';

interface TrainingModeCardProps {
  title: string;
  description: string;
  enabled?: boolean;
  onPress?: () => void;
}

export function TrainingModeCard({
  title,
  description,
  enabled = false,
  onPress,
}: TrainingModeCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole={enabled ? 'button' : undefined}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: enabled ? colors.primary : colors.border },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: enabled ? colors.primary : colors.surfaceMuted }]}>
        <Text style={[styles.badgeText, { color: enabled ? colors.onPrimary : colors.textMuted }]}>
          {enabled ? 'Train' : 'Soon'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    marginTop: spacing.xs,
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
