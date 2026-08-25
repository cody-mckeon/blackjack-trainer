import type { ImageSourcePropType } from 'react-native';

import { calculateDecksPlayedFromDiscardedCards } from '../domain/deckCalculations';

export type DiscardTrayPhotoViewType = 'calibration' | 'player-view' | 'casino';

export interface DiscardTrayPhoto {
  discardedCards: number;
  decksPlayed: number;
  image: ImageSourcePropType;
  viewType?: DiscardTrayPhotoViewType;
  variantId?: string;
}

function calibrationPhoto(discardedCards: number, image: ImageSourcePropType): DiscardTrayPhoto {
  return {
    discardedCards,
    decksPlayed: calculateDecksPlayedFromDiscardedCards(discardedCards),
    image,
    viewType: 'calibration',
    variantId: 'calibration-a',
  };
}

// Keep every require literal so Metro can statically discover and bundle the available assets.
export const DISCARD_TRAY_PHOTOS: readonly DiscardTrayPhoto[] = [
  calibrationPhoto(13, require('../../../assets/deck-estimation/calibration/discard-013.jpg')),
  calibrationPhoto(26, require('../../../assets/deck-estimation/calibration/discard-026.jpg')),
  calibrationPhoto(39, require('../../../assets/deck-estimation/calibration/discard-039.jpg')),
  calibrationPhoto(52, require('../../../assets/deck-estimation/calibration/discard-052.jpg')),
  calibrationPhoto(65, require('../../../assets/deck-estimation/calibration/discard-065.jpg')),
  calibrationPhoto(78, require('../../../assets/deck-estimation/calibration/discard-078.jpg')),
  calibrationPhoto(91, require('../../../assets/deck-estimation/calibration/discard-091.jpg')),
  calibrationPhoto(104, require('../../../assets/deck-estimation/calibration/discard-104.jpg')),
  calibrationPhoto(117, require('../../../assets/deck-estimation/calibration/discard-117.jpg')),
  calibrationPhoto(130, require('../../../assets/deck-estimation/calibration/discard-130.jpg')),
  calibrationPhoto(143, require('../../../assets/deck-estimation/calibration/discard-143.jpg')),
  calibrationPhoto(156, require('../../../assets/deck-estimation/calibration/discard-156.jpg')),
  calibrationPhoto(169, require('../../../assets/deck-estimation/calibration/discard-169.jpg')),
  calibrationPhoto(182, require('../../../assets/deck-estimation/calibration/discard-182.jpg')),
  calibrationPhoto(195, require('../../../assets/deck-estimation/calibration/discard-195.jpg')),
  calibrationPhoto(208, require('../../../assets/deck-estimation/calibration/discard-208.jpg')),
  calibrationPhoto(221, require('../../../assets/deck-estimation/calibration/discard-221.jpg')),
  calibrationPhoto(234, require('../../../assets/deck-estimation/calibration/discard-234.jpg')),
  calibrationPhoto(247, require('../../../assets/deck-estimation/calibration/discard-247.jpg')),
  calibrationPhoto(260, require('../../../assets/deck-estimation/calibration/discard-260.jpg')),
  calibrationPhoto(273, require('../../../assets/deck-estimation/calibration/discard-273.jpg')),
  calibrationPhoto(286, require('../../../assets/deck-estimation/calibration/discard-286.jpg')),
  calibrationPhoto(299, require('../../../assets/deck-estimation/calibration/discard-299.jpg')),
  calibrationPhoto(312, require('../../../assets/deck-estimation/calibration/discard-312.jpg')),
];

const PHOTOS_BY_DISCARDED_CARDS = DISCARD_TRAY_PHOTOS.reduce<Map<number, DiscardTrayPhoto[]>>(
  (registry, photo) => {
    registry.set(photo.discardedCards, [...(registry.get(photo.discardedCards) ?? []), photo]);
    return registry;
  },
  new Map(),
);

export const AVAILABLE_DISCARDED_CARD_COUNTS = Object.freeze(
  [...PHOTOS_BY_DISCARDED_CARDS.keys()].sort((a, b) => a - b),
);

export function getDiscardTrayPhotos(discardedCardCount: number): readonly DiscardTrayPhoto[] {
  return Number.isInteger(discardedCardCount)
    ? (PHOTOS_BY_DISCARDED_CARDS.get(discardedCardCount) ?? [])
    : [];
}

export function getDiscardTrayPhoto(
  discardedCardCount: number,
  preferredViewType?: DiscardTrayPhotoViewType,
): DiscardTrayPhoto | undefined {
  const photos = getDiscardTrayPhotos(discardedCardCount);
  return (preferredViewType ? photos.find((photo) => photo.viewType === preferredViewType) : undefined) ?? photos[0];
}
