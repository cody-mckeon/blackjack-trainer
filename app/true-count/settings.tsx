import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { radii, spacing } from '@/constants/theme';
import { useTrueCount } from '@/features/true-count/context/TrueCountProvider';
import {
  getDefaultShoeRunningCountRange,
  getTheoreticalRunningCountBound,
} from '@/features/true-count/domain/runningCountBounds';
import type {
  RunningCountRangeMode,
  ShoeSize,
  ShoeSizeSelection,
  TrueCountPracticeMode,
  TrueCountSettings,
} from '@/features/true-count/types';
import type { SessionLength } from '@/types/training';
import { useAppTheme } from '@/lib/useAppTheme';

const SHOE_OPTIONS: readonly { label: string; value: ShoeSizeSelection }[] = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
  { label: 'Mixed', value: 'mixed' },
];

const SESSION_OPTIONS: readonly { label: string; value: SessionLength }[] = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: 'Endless', value: 'endless' },
];

const RANGE_MODE_OPTIONS: readonly { label: string; value: RunningCountRangeMode }[] = [
  { label: 'Realistic', value: 'realistic' },
  { label: 'Custom', value: 'custom' },
];

function formatDefaultRange(shoeSize: ShoeSizeSelection): string {
  const formatShoe = (size: ShoeSize) => {
    const range = getDefaultShoeRunningCountRange(size);
    return `${size}D ${range.minimum} to +${range.maximum}`;
  };

  return shoeSize === 'mixed' ? ([1, 2, 4, 6, 8] as ShoeSize[]).map(formatShoe).join(' · ') : formatShoe(shoeSize);
}

export default function TrueCountSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors } = useAppTheme();
  const { settings, isLoading, saveSettings, startSession } = useTrueCount();
  const [shoeSize, setShoeSize] = useState<ShoeSizeSelection>(settings.shoeSize);
  const [sessionLength, setSessionLength] = useState<SessionLength>(settings.sessionLength);
  const [rangeMode, setRangeMode] = useState<RunningCountRangeMode>(settings.runningCountRangeMode);
  const [minimum, setMinimum] = useState(String(settings.runningCountMin));
  const [maximum, setMaximum] = useState(String(settings.runningCountMax));
  const [isStarting, setIsStarting] = useState(false);
  const mode: TrueCountPracticeMode = params.mode === 'adaptive' ? 'adaptive' : 'standard';

  useEffect(() => {
    if (isLoading) return;
    setShoeSize(settings.shoeSize);
    setSessionLength(settings.sessionLength);
    setRangeMode(settings.runningCountRangeMode);
    setMinimum(String(settings.runningCountMin));
    setMaximum(String(settings.runningCountMax));
  }, [isLoading, settings]);

  const parsedMinimum = Number(minimum);
  const parsedMaximum = Number(maximum);
  const maximumTheoreticalBound =
    shoeSize === 'mixed' ? getTheoreticalRunningCountBound(8) : getTheoreticalRunningCountBound(shoeSize);
  const isRangeValid =
    Number.isInteger(parsedMinimum) &&
    Number.isInteger(parsedMaximum) &&
    parsedMinimum <= parsedMaximum &&
    parsedMinimum >= -maximumTheoreticalBound &&
    parsedMaximum <= maximumTheoreticalBound;

  const handleStart = async () => {
    if ((rangeMode === 'custom' && !isRangeValid) || isStarting) return;

    const nextSettings: TrueCountSettings = {
      shoeSize,
      runningCountRangeMode: rangeMode,
      runningCountMin: parsedMinimum,
      runningCountMax: parsedMaximum,
      deckPrecision: 0.5,
      sessionLength,
    };

    setIsStarting(true);
    try {
      await saveSettings(nextSettings);
      startSession(nextSettings, { mode });
      router.push('/true-count/drill');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>{mode === 'adaptive' ? 'Adaptive Practice' : 'Standard Practice'}</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        {mode === 'adaptive'
          ? 'Your weaker, slower, and overdue deck patterns will appear more often.'
          : 'Choose a pace, then get straight to the count.'}
      </Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Shoe size</Text>
        <SegmentedSelector
          accessibilityLabel="Shoe size"
          options={SHOE_OPTIONS}
          value={shoeSize}
          onChange={setShoeSize}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Running count range</Text>
        <SegmentedSelector
          accessibilityLabel="Running count range mode"
          options={RANGE_MODE_OPTIONS}
          value={rangeMode}
          onChange={setRangeMode}
        />
        {rangeMode === 'realistic' ? (
          <View style={[styles.realisticSetting, { backgroundColor: colors.surfaceMuted }]}>
            <Text style={[styles.readonlyValue, { color: colors.text }]}>Realistic RC generation</Text>
            <Text style={[styles.readonlyNote, { color: colors.textMuted }]}>Running-count questions are adjusted based on shoe size and how many decks have already been played.</Text>
            <Text style={[styles.boundSummary, { color: colors.text }]}>Broad defaults: {formatDefaultRange(shoeSize)}</Text>
          </View>
        ) : (
          <>
            <View style={[styles.rangeRow, styles.customRange]}>
              <View style={styles.rangeField}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Minimum</Text>
                <TextInput
                  accessibilityLabel="Minimum running count"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setMinimum}
                  selectTextOnFocus
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={minimum}
                />
              </View>
              <View style={styles.rangeField}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Maximum</Text>
                <TextInput
                  accessibilityLabel="Maximum running count"
                  keyboardType="numbers-and-punctuation"
                  onChangeText={setMaximum}
                  selectTextOnFocus
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={maximum}
                />
              </View>
            </View>
            <Text style={[styles.limitNote, { color: colors.textMuted }]}>Theoretical limit for this selection: ±{maximumTheoreticalBound}</Text>
            {!isRangeValid ? (
              <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>Use whole numbers from {-maximumTheoreticalBound} to +{maximumTheoreticalBound}, with minimum no greater than maximum.</Text>
            ) : null}
          </>
        )}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Deck precision</Text>
        <View style={[styles.readonlySetting, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[styles.readonlyValue, { color: colors.text }]}>½ deck</Text>
          <Text style={[styles.readonlyNote, { color: colors.textMuted }]}>Quarter-deck support can be added later.</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Session length</Text>
        <SegmentedSelector
          accessibilityLabel="Session length"
          options={SESSION_OPTIONS}
          value={sessionLength}
          onChange={setSessionLength}
        />
      </View>

      <AppButton
        disabled={(rangeMode === 'custom' && !isRangeValid) || isStarting}
        label={isStarting ? 'Starting…' : 'Start training'}
        onPress={() => void handleStart()}
        style={styles.startButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  intro: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: 16,
    lineHeight: 23,
  },
  field: {
    marginBottom: spacing.xl,
  },
  label: {
    marginBottom: spacing.md,
    fontSize: 17,
    fontWeight: '800',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rangeField: {
    flex: 1,
  },
  inputLabel: {
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 19,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  error: {
    marginTop: spacing.sm,
    fontSize: 13,
    lineHeight: 19,
  },
  readonlySetting: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  readonlyValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  readonlyNote: {
    marginTop: spacing.xs,
    fontSize: 13,
  },
  realisticSetting: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  boundSummary: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '800',
  },
  customRange: {
    marginTop: spacing.md,
  },
  limitNote: {
    marginTop: spacing.sm,
    fontSize: 12,
  },
  startButton: {
    marginTop: spacing.sm,
  },
});
