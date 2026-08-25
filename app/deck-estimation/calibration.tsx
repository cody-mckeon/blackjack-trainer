import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { DiscardTrayPhoto } from '@/components/DiscardTrayPhoto';
import { Screen } from '@/components/Screen';
import { SegmentedSelector } from '@/components/SegmentedSelector';
import { radii, spacing } from '@/constants/theme';
import { useDeckEstimation } from '@/features/deck-estimation/context/DeckEstimationProvider';
import { calculateDecksPlayed, calculateDiscardedCardCount, generateCalibrationValues } from '@/features/deck-estimation/domain/deckCalculations';
import { createTrayVisualVariation } from '@/features/deck-estimation/domain/questionGenerator';
import { DECK_ESTIMATION_SHOE_SIZES, type DeckEstimationShoeSize } from '@/features/deck-estimation/types';
import { useAppTheme } from '@/lib/useAppTheme';

const SHOE_OPTIONS = DECK_ESTIMATION_SHOE_SIZES.map((value) => ({ label: `${value}`, value }));

export default function DeckEstimationCalibrationScreen() {
  const { colors } = useAppTheme();
  const { settings, saveSettings } = useDeckEstimation();
  const initialShoe = settings.shoeSize === 'mixed' ? 6 : settings.shoeSize;
  const [shoeSize, setShoeSize] = useState<DeckEstimationShoeSize>(initialShoe);
  const [index, setIndex] = useState(0);
  const values = useMemo(() => generateCalibrationValues(shoeSize, 0.25), [shoeSize]);
  const decksRemaining = values[index] ?? shoeSize;
  const decksPlayed = calculateDecksPlayed(shoeSize, decksRemaining);
  const discardedCardCount = calculateDiscardedCardCount(shoeSize, decksRemaining);
  const variation = useMemo(
    () => createTrayVisualVariation(shoeSize * 100 + Math.round(decksRemaining * 4)),
    [decksRemaining, shoeSize],
  );

  useEffect(() => {
    setIndex(0);
  }, [shoeSize]);

  const handleShoeChange = (next: DeckEstimationShoeSize) => {
    setShoeSize(next);
    void saveSettings({ ...settings, shoeSize: next });
  };

  return (
    <Screen>
      <Text style={[styles.heading, { color: colors.text }]}>Calibration</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>Move between quarter-deck landmarks and memorize the stack height.</Text>

      <Text style={[styles.label, { color: colors.text }]}>Starting shoe size</Text>
      <SegmentedSelector
        accessibilityLabel="Calibration shoe size"
        options={SHOE_OPTIONS}
        value={shoeSize}
        onChange={handleShoeChange}
      />

      <View style={[styles.studyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.shoeLabel, { color: colors.primary }]}>{shoeSize}-DECK SHOE</Text>
        <DiscardTrayPhoto
          discardedCardCount={discardedCardCount}
          startingDeckCount={shoeSize}
          fallbackVariation={variation}
          preferredViewType="calibration"
        />
        <Text style={[styles.primaryValue, { color: colors.text }]}>Decks remaining: {decksRemaining}</Text>
        <View style={styles.factsRow}>
          <Text style={[styles.fact, { color: colors.textMuted }]}>Decks played: {decksPlayed}</Text>
          <Text style={[styles.fact, { color: colors.textMuted }]}>Approx. cards discarded: {discardedCardCount}</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <AppButton
          label="Previous"
          variant="secondary"
          disabled={index === 0}
          onPress={() => setIndex((current) => Math.max(0, current - 1))}
          style={styles.control}
        />
        <View style={styles.positionWrap}>
          <Text style={[styles.position, { color: colors.textMuted }]}>{index + 1} / {values.length}</Text>
        </View>
        <AppButton
          label="Next"
          disabled={index === values.length - 1}
          onPress={() => setIndex((current) => Math.min(values.length - 1, current + 1))}
          style={styles.control}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  intro: { marginTop: spacing.sm, fontSize: 16, lineHeight: 23 },
  label: { marginTop: spacing.xl, marginBottom: spacing.md, fontSize: 17, fontWeight: '800' },
  studyCard: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  shoeLabel: { textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 1.4 },
  primaryValue: { textAlign: 'center', fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  factsRow: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  fact: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  control: { flex: 1 },
  positionWrap: { minWidth: 54, alignItems: 'center' },
  position: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
