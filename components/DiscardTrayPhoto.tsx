import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '@/constants/theme';
import {
  getDiscardTrayPhoto,
  type DiscardTrayPhoto,
  type DiscardTrayPhotoViewType,
} from '@/features/deck-estimation/data/discardTrayPhotos';
import type { TrayVisualVariation } from '@/features/deck-estimation/types';
import { useAppTheme } from '@/lib/useAppTheme';

import { DiscardTray } from './DiscardTray';

export interface DiscardTrayPhotoProps {
  discardedCardCount: number;
  startingDeckCount: number;
  maxPhotoWidth?: number;
  preferredViewType?: DiscardTrayPhotoViewType;
  fallbackVariation?: TrayVisualVariation;
  onVisualReady?: () => void;
  showDevelopmentSource?: boolean;
  testID?: string;
}

export type DiscardTrayVisualSource =
  | { kind: 'photo'; photo: DiscardTrayPhoto }
  | { kind: 'synthetic' };

export function resolveDiscardTrayVisualSource(
  discardedCardCount: number,
  preferredViewType?: DiscardTrayPhotoViewType,
): DiscardTrayVisualSource {
  const photo = getDiscardTrayPhoto(discardedCardCount, preferredViewType);
  return photo ? { kind: 'photo', photo } : { kind: 'synthetic' };
}

export function DiscardTrayPhoto({
  discardedCardCount,
  startingDeckCount,
  maxPhotoWidth,
  preferredViewType,
  fallbackVariation,
  onVisualReady,
  showDevelopmentSource = __DEV__,
  testID,
}: DiscardTrayPhotoProps) {
  const { colors } = useAppTheme();
  const resolvedSource = resolveDiscardTrayVisualSource(discardedCardCount, preferredViewType);
  const photo = resolvedSource.kind === 'photo' ? resolvedSource.photo : undefined;
  const [failedPhotoKey, setFailedPhotoKey] = useState<string | null>(null);
  const photoKey = photo ? `${photo.discardedCards}:${photo.variantId ?? 'default'}` : null;
  const usesSyntheticFallback = !photo || failedPhotoKey === photoKey;

  useEffect(() => {
    setFailedPhotoKey(null);
  }, [photoKey]);

  useEffect(() => {
    if (usesSyntheticFallback) onVisualReady?.();
  }, [onVisualReady, usesSyntheticFallback]);

  const handlePhotoError = () => {
    if (__DEV__) {
      console.warn(`Discard-tray photo failed to render for ${Math.round(discardedCardCount)} discarded cards.`);
    }
    setFailedPhotoKey(photoKey);
  };

  return (
    <View style={styles.container} testID={testID}>
      {usesSyntheticFallback ? (
        <DiscardTray
          discardedCardCount={discardedCardCount}
          startingDeckCount={startingDeckCount}
          variation={fallbackVariation}
          testID={testID ? `${testID}-synthetic` : undefined}
        />
      ) : (
        <View
          style={[
            styles.photoFrame,
            { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
            maxPhotoWidth === undefined ? null : { maxWidth: maxPhotoWidth },
          ]}
        >
          <Image
            accessibilityLabel={`Real discard-tray photograph showing ${Math.round(discardedCardCount)} discarded cards`}
            onError={handlePhotoError}
            onLoad={onVisualReady}
            resizeMode="contain"
            source={photo.image}
            style={styles.photo}
            testID={testID ? `${testID}-photo` : undefined}
          />
        </View>
      )}
      {showDevelopmentSource ? (
        <Text style={[styles.sourceLabel, { color: colors.textMuted }]}>
          {usesSyntheticFallback ? 'SYNTHETIC FALLBACK' : 'REAL PHOTO'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  photoFrame: {
    width: '100%',
    maxWidth: 440,
    aspectRatio: 3 / 4,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  sourceLabel: {
    marginTop: spacing.xs,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    opacity: 0.62,
  },
});
