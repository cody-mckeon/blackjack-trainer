import { CARD_RANKS } from '../cardTypes';
import { calculateRunningCount, getHiLoCategory, getHiLoValue, getHiddenCategoryFromEndingCount } from '../hiLo';
import { generateShoe } from '../shoe';

describe('Hi-Lo values', () => {
  it('scores every rank with the standard system', () => {
    const expected = { A: -1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, '10': -1, J: -1, Q: -1, K: -1 };
    for (const rank of CARD_RANKS) expect(getHiLoValue(rank)).toBe(expected[rank]);
  });

  it.each([1, 2, 4, 6, 8] as const)('%i-deck shoe is balanced', (deckCount) => {
    expect(calculateRunningCount(generateShoe(deckCount))).toBe(0);
  });

  it('maps ending counts back to the hidden category', () => {
    expect(getHiddenCategoryFromEndingCount(-1)).toBe('low');
    expect(getHiddenCategoryFromEndingCount(0)).toBe('neutral');
    expect(getHiddenCategoryFromEndingCount(1)).toBe('high');
    expect(getHiddenCategoryFromEndingCount(2)).toBeNull();
    expect(getHiLoCategory('K')).toBe('high');
  });
});
