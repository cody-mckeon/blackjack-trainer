import {
  AVAILABLE_DISCARDED_CARD_COUNTS,
  DISCARD_TRAY_PHOTOS,
  getDiscardTrayPhoto,
  getDiscardTrayPhotos,
  getFirstAvailableDiscardPhotoIndex,
} from '../discardTrayPhotos';
import { calculateDecksRemaining } from '../../domain/deckCalculations';

describe('discard-tray photo registry', () => {
  it('looks up quarter-deck ground truth by exact discarded-card count', () => {
    expect(getDiscardTrayPhoto(13)).toMatchObject({ discardedCards: 13, decksPlayed: 0.25 });
    expect(getDiscardTrayPhoto(26)).toMatchObject({ discardedCards: 26, decksPlayed: 0.5 });
    expect(getDiscardTrayPhoto(39)).toMatchObject({ discardedCards: 39, decksPlayed: 0.75 });
    expect(getDiscardTrayPhoto(52)).toMatchObject({ discardedCards: 52, decksPlayed: 1 });
    expect(getDiscardTrayPhoto(104)).toMatchObject({ discardedCards: 104, decksPlayed: 2 });
  });

  it('contains the available partial dataset without inventing missing assets', () => {
    expect(DISCARD_TRAY_PHOTOS).toHaveLength(24);
    expect(AVAILABLE_DISCARDED_CARD_COUNTS[0]).toBe(13);
    expect(AVAILABLE_DISCARDED_CARD_COUNTS.at(-1)).toBe(312);
    expect(AVAILABLE_DISCARDED_CARD_COUNTS.every((count) => count % 13 === 0)).toBe(true);
    expect(getDiscardTrayPhotos(325)).toEqual([]);
    expect(getDiscardTrayPhoto(364)).toBeUndefined();
    expect(getDiscardTrayPhoto(51.6)).toBeUndefined();
  });

  it('selects the first photographed landmark while preserving safe fallback-only datasets', () => {
    expect(getFirstAvailableDiscardPhotoIndex([0, 13, 26], 'calibration')).toBe(1);
    expect(getFirstAvailableDiscardPhotoIndex([0, 325, 338], 'calibration')).toBe(0);
    expect(getFirstAvailableDiscardPhotoIndex([], 'calibration')).toBe(0);
  });

  it('supports future multiple variants at one card count', () => {
    expect(getDiscardTrayPhotos(52)).toEqual([
      expect.objectContaining({ discardedCards: 52, viewType: 'calibration', variantId: 'calibration-a' }),
    ]);
  });

  it('reuses one 104-card photograph across different starting shoe sizes', () => {
    const photo = getDiscardTrayPhoto(104);
    expect(photo).toBeDefined();
    expect(calculateDecksRemaining(6, photo!.discardedCards)).toBe(4);
    expect(calculateDecksRemaining(8, photo!.discardedCards)).toBe(6);
    expect(getDiscardTrayPhoto(104)?.image).toBe(photo?.image);
  });
});
