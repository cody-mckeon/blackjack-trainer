import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { spacing } from '@/constants/theme';
import { useDeckEstimation } from '@/features/deck-estimation/context/DeckEstimationProvider';
import type { DeckEstimationPrecision, DeckEstimationSettings, DeckEstimationShoeSelection } from '@/features/deck-estimation/types';
import type { SessionLength } from '@/types/training';
import { useAppTheme } from '@/lib/useAppTheme';

const SHOE_OPTIONS: readonly { label: string; value: DeckEstimationShoeSelection }[] = [
  { label: '2', value: 2 }, { label: '4', value: 4 }, { label: '6', value: 6 }, { label: '8', value: 8 }, { label: 'Mixed', value: 'mixed' },
];
const PRECISION_OPTIONS: readonly { label: string; value: DeckEstimationPrecision }[] = [
  { label: 'Whole', value: 'whole' }, { label: 'Half', value: 'half' }, { label: 'Quarter', value: 'quarter' }, { label: 'Mixed', value: 'mixed' },
];
const SESSION_OPTIONS: readonly { label: string; value: SessionLength }[] = [
  { label: '10', value: 10 }, { label: '25', value: 25 }, { label: '50', value: 50 }, { label: 'Endless', value: 'endless' },
];

function requestedPrecision(mode?: string): DeckEstimationPrecision | undefined {
  return mode === 'whole' || mode === 'half' || mode === 'quarter' || mode === 'mixed' ? mode : undefined;
}

export default function DeckEstimationSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { colors } = useAppTheme();
  const { settings, isLoading, saveSettings, startSession } = useDeckEstimation();
  const routePrecision = requestedPrecision(params.mode);
  const [shoeSize, setShoeSize] = useState<DeckEstimationShoeSelection>(routePrecision === 'mixed' ? 'mixed' : settings.shoeSize);
  const [precision, setPrecision] = useState<DeckEstimationPrecision>(routePrecision ?? settings.precision);
  const [sessionLength, setSessionLength] = useState<SessionLength>(settings.sessionLength);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setShoeSize(routePrecision === 'mixed' ? 'mixed' : settings.shoeSize);
    setPrecision(routePrecision ?? settings.precision);
    setSessionLength(settings.sessionLength);
  }, [isLoading, routePrecision, settings]);

  const handleStart = async () => {
    if (isStarting) return;
    const next: DeckEstimationSettings = { shoeSize, precision, sessionLength };
    setIsStarting(true);
    try {
      await saveSettings(next);
      startSession(next);
      router.push('/deck-estimation/drill');
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return <Screen scroll={false} contentStyle={styles.loading}><ActivityIndicator color={colors.primary} size="large" /></Screen>;
  }

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>Practice setup</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Choose the landmarks you want to recognize.</Text>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Shoe size</Text>
        <SegmentedSelector accessibilityLabel="Shoe size" options={SHOE_OPTIONS} value={shoeSize} onChange={setShoeSize} />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Precision</Text>
        <SegmentedSelector accessibilityLabel="Deck estimate precision" options={PRECISION_OPTIONS} value={precision} onChange={setPrecision} />
      </View>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text }]}>Session length</Text>
        <SegmentedSelector accessibilityLabel="Session length" options={SESSION_OPTIONS} value={sessionLength} onChange={setSessionLength} />
      </View>

      <AppButton label={isStarting ? 'Starting…' : 'Start training'} disabled={isStarting} onPress={() => void handleStart()} style={styles.start} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  intro: { marginTop: spacing.sm, marginBottom: spacing.xl, fontSize: 16, lineHeight: 23 },
  field: { marginBottom: spacing.xl },
  label: { marginBottom: spacing.md, fontSize: 17, fontWeight: '800' },
  start: { marginTop: spacing.xl },
});
