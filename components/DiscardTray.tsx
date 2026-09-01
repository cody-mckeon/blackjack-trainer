import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import { CARDS_PER_DECK } from '@/features/deck-estimation/constants';
import { createTrayVisualVariation } from '@/features/deck-estimation/domain/questionGenerator';
import type { TrayVisualVariation } from '@/features/deck-estimation/types';
import { useAppTheme } from '@/lib/useAppTheme';

const CARD_STACK_WIDTH = 154;
const CARD_THICKNESS_PX = 0.42;
const MAX_VISIBLE_STACK_HEIGHT = 176;

export interface DiscardTrayProps {
  discardedCardCount: number;
  startingDeckCount: number;
  variation?: TrayVisualVariation;
  testID?: string;
}

export function calculateDiscardStackHeight(discardedCardCount: number): number {
  return Math.min(MAX_VISIBLE_STACK_HEIGHT, Math.max(0, discardedCardCount) * CARD_THICKNESS_PX);
}

export function calculateVariedStackHeight(
  discardedCardCount: number,
  variation: TrayVisualVariation,
): number {
  return calculateDiscardStackHeight(discardedCardCount) * variation.compression;
}

export function DiscardTray({
  discardedCardCount,
  startingDeckCount,
  variation = createTrayVisualVariation(0),
  testID,
}: DiscardTrayProps) {
  const { colors, isDark } = useAppTheme();
  const boundedCardCount = Math.min(
    Math.max(0, Math.round(discardedCardCount)),
    Math.max(0, Math.round(startingDeckCount * CARDS_PER_DECK)),
  );
  const stackHeight = calculateVariedStackHeight(boundedCardCount, variation);
  const edgeCount = Math.min(14, Math.floor(stackHeight / 6));
  const edgeLines = Array.from({ length: edgeCount }, (_, index) => index);
  const plasticColor = isDark ? 'rgba(194, 222, 211, 0.24)' : 'rgba(54, 84, 72, 0.2)';
  const plasticEdge = isDark ? 'rgba(211, 235, 226, 0.5)' : 'rgba(33, 57, 48, 0.42)';

  return (
    <View
      accessibilityLabel={`${boundedCardCount} cards in the discard tray from a ${startingDeckCount}-deck shoe`}
      accessibilityRole="image"
      style={styles.scene}
      testID={testID}
    >
      <View style={[styles.trayBack, { backgroundColor: plasticColor, borderColor: plasticEdge }]} />
      <View style={styles.stackStage}>
        {boundedCardCount > 0 ? (
          <View
            style={[
              styles.cardStack,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                height: Math.max(3, stackHeight),
                transform: [
                  { translateX: variation.horizontalOffset },
                  { rotate: `${variation.leanDegrees}deg` },
                ],
              },
            ]}
          >
            {edgeLines.map((edge) => (
              <View
                key={edge}
                style={[
                  styles.cardEdge,
                  {
                    backgroundColor: edge % 3 === 0 ? colors.textMuted : colors.border,
                    bottom: Math.min(stackHeight - 1, (edge + 1) * (stackHeight / (edgeCount + 1))),
                    left: edge % 4 === 0 ? 2 : edge % 4 === 1 ? -1 : 0,
                  },
                ]}
              />
            ))}
            <View style={[styles.topCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.topCardInset, { borderColor: colors.border }]} />
            </View>
          </View>
        ) : (
          <Text style={[styles.emptyLabel, { color: colors.textMuted }]}>Empty tray</Text>
        )}
      </View>
      <View style={[styles.trayFront, { backgroundColor: plasticColor, borderColor: plasticEdge }]}>
        <View style={[styles.trayHighlight, { backgroundColor: plasticEdge }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    width: '100%',
    maxWidth: 330,
    height: 238,
    alignSelf: 'center',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  trayBack: {
    position: 'absolute',
    bottom: 22,
    width: 218,
    height: 202,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  stackStage: {
    width: CARD_STACK_WIDTH + 12,
    height: 188,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardStack: {
    width: CARD_STACK_WIDTH,
    minHeight: 3,
    borderWidth: 1,
    borderRadius: 3,
    overflow: 'visible',
  },
  cardEdge: {
    position: 'absolute',
    width: CARD_STACK_WIDTH - 2,
    height: StyleSheet.hairlineWidth,
    opacity: 0.46,
  },
  topCard: {
    position: 'absolute',
    top: -10,
    left: -1,
    width: CARD_STACK_WIDTH,
    height: 18,
    borderWidth: 1,
    borderRadius: 4,
  },
  topCardInset: {
    position: 'absolute',
    top: 4,
    left: 8,
    right: 8,
    height: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 2,
    opacity: 0.55,
  },
  emptyLabel: {
    marginBottom: spacing.md,
    fontSize: 13,
    fontWeight: '700',
  },
  trayFront: {
    position: 'absolute',
    bottom: 8,
    width: 238,
    height: 43,
    borderWidth: 3,
    borderRadius: radii.sm,
  },
  trayHighlight: {
    position: 'absolute',
    top: 6,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: radii.pill,
    opacity: 0.45,
  },
});
