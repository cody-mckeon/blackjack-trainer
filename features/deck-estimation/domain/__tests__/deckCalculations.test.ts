import {
  calculateDecksPlayed,
  calculateDecksPlayedFromDiscardedCards,
  calculateDecksRemaining,
  calculateDiscardedCardCount,
  generateCalibrationValues,
} from '../deckCalculations';

describe('deck estimation calculations', () => {
  it('converts between decks remaining, played, and discarded card count', () => {
    expect(calculateDecksPlayed(6, 3.5)).toBe(2.5);
    expect(calculateDiscardedCardCount(6, 3.5)).toBe(130);
    expect(calculateDecksRemaining(6, 130)).toBe(3.5);
  });

  it('uses exact half-deck card landmarks', () => {
    expect(calculateDiscardedCardCount(6, 5.5)).toBe(26);
    expect(calculateDiscardedCardCount(6, 5)).toBe(52);
    expect(calculateDiscardedCardCount(6, 4.5)).toBe(78);
    expect(calculateDiscardedCardCount(6, 4)).toBe(104);
  });

  it('maps exact photo card counts back to decks played', () => {
    expect(calculateDecksPlayedFromDiscardedCards(13)).toBe(0.25);
    expect(calculateDecksPlayedFromDiscardedCards(26)).toBe(0.5);
    expect(calculateDecksPlayedFromDiscardedCards(39)).toBe(0.75);
    expect(calculateDecksPlayedFromDiscardedCards(52)).toBe(1);
    expect(calculateDecksPlayedFromDiscardedCards(104)).toBe(2);
  });

  it.each([2, 4, 6, 8])('generates calibration values within a %i-deck shoe', (shoeSize) => {
    const values = generateCalibrationValues(shoeSize);
    expect(values[0]).toBe(shoeSize);
    expect(values.at(-1)).toBe(1);
    expect(values.every((value) => value <= shoeSize && value >= 1)).toBe(true);
  });

  it('generates quarter-deck Calibration progression without changing scored precision', () => {
    expect(generateCalibrationValues(6, 0.25).slice(0, 5)).toEqual([6, 5.75, 5.5, 5.25, 5]);
    expect(generateCalibrationValues(6, 0.25).at(-1)).toBe(1);
    expect(generateCalibrationValues(6, 0.25)).toHaveLength(21);
  });
});
