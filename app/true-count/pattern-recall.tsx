import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { radii, spacing } from '@/constants/theme';
import { PatternGuide } from '@/features/true-count/components/PatternGuide';
import { useTrueCount } from '@/features/true-count/context/TrueCountProvider';
import { getValidDecksRemaining } from '@/features/true-count/domain/questionGenerator';
import {
  type PatternDecksRemaining,
  type ShoeSize,
} from '@/features/true-count/types';
import { useAppTheme } from '@/lib/useAppTheme';
import type { SessionLength } from '@/types/training';

const SHOE_OPTIONS: readonly { label: string; value: ShoeSize }[] = [1, 2, 4, 6, 8].map((value) => ({
  label: String(value),
  value: value as ShoeSize,
}));
const SESSION_OPTIONS: readonly { label: string; value: SessionLength }[] = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: 'Endless', value: 'endless' },
];

export default function PatternRecallScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { settings, isLoading, saveSettings, startSession } = useTrueCount();
  const [shoeSize, setShoeSize] = useState<ShoeSize>(6);
  const [decksRemaining, setDecksRemaining] = useState<PatternDecksRemaining>(3.5);
  const [sessionLength, setSessionLength] = useState<SessionLength>(settings.sessionLength);
  const [showGuide, setShowGuide] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!isLoading) setSessionLength(settings.sessionLength);
  }, [isLoading, settings.sessionLength]);

  const deckOptions = useMemo(
    () => getValidDecksRemaining(shoeSize, 0.5).map((value) => ({ label: String(value), value: value as PatternDecksRemaining })),
    [shoeSize],
  );

  const handleShoeChange = (nextShoeSize: ShoeSize) => {
    setShoeSize(nextShoeSize);
    const validDeckValues = getValidDecksRemaining(nextShoeSize, 0.5);
    if (!validDeckValues.includes(decksRemaining)) {
      setDecksRemaining(validDeckValues[Math.min(1, validDeckValues.length - 1)] as PatternDecksRemaining);
    }
  };

  const handleStart = async () => {
    if (isStarting) return;
    const storedSettings = { ...settings, sessionLength };
    const sessionSettings = { ...storedSettings, shoeSize };

    setIsStarting(true);
    try {
      await saveSettings(storedSettings);
      startSession(sessionSettings, { mode: 'pattern-recall', patternDecksRemaining: decksRemaining });
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
      <Text style={[styles.heading, { color: colors.text }]}>Pattern Recall</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Choose one deck value and memorize its running-count landmarks.</Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Starting shoe</Text>
        <SegmentedSelector
          accessibilityLabel="Starting shoe size"
          options={SHOE_OPTIONS}
          value={shoeSize}
          onChange={handleShoeChange}
        />
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Decks remaining</Text>
        <SegmentedSelector
          accessibilityLabel="Decks remaining to study"
          options={deckOptions}
          value={decksRemaining}
          onChange={setDecksRemaining}
        />
      </View>

      <View style={styles.field}>
        <AppButton
          label={showGuide ? 'Hide Pattern Guide' : 'Show Pattern Guide'}
          onPress={() => setShowGuide((visible) => !visible)}
          variant="secondary"
        />
        {showGuide ? (
          <View style={styles.guideWrap}>
            <PatternGuide decksRemaining={decksRemaining} />
          </View>
        ) : null}
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

      <View style={[styles.studyCard, { backgroundColor: colors.surfaceMuted }]}>
        <Text style={[styles.studyEyebrow, { color: colors.primary }]}>STUDY</Text>
        <Text style={[styles.studyValue, { color: colors.text }]}>{shoeSize}-deck shoe · {decksRemaining} remaining</Text>
        <Text style={[styles.studyNote, { color: colors.textMuted }]}>Every question uses this point in the shoe and a mathematically possible running count.</Text>
      </View>

      <AppButton
        disabled={isStarting}
        label={isStarting ? 'Starting…' : 'Start recall drill'}
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
  guideWrap: {
    marginTop: spacing.md,
  },
  studyCard: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  studyEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  studyValue: {
    marginTop: spacing.xs,
    fontSize: 19,
    fontWeight: '900',
  },
  studyNote: {
    marginTop: spacing.xs,
    fontSize: 13,
  },
  startButton: {
    marginTop: spacing.lg,
  },
});
