import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import { useAppTheme } from '@/lib/useAppTheme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function AppButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
  accessibilityHint,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const backgroundColor = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surfaceMuted : 'transparent';
  const textColor = variant === 'primary' ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor: variant === 'ghost' ? colors.border : backgroundColor },
        pressed && !disabled && { opacity: 0.8 },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
});
