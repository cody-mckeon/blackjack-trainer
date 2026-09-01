import { getCardKey } from '../cardTypes';
import { calculateRunningCount, getHiLoCategory, getHiLoValue } from '../hiLo';
import { generateShoe, removeHiddenCard, shuffleShoe } from '../shoe';

function composition(cards: ReturnType<typeof generateShoe>) {
  return cards.map(getCardKey).sort();
}

describe('blackjack shoes', () => {
  it.each([[1, 52], [2, 104], [4, 208], [6, 312], [8, 416]] as const)(
    '%i decks contains %i cards',
    (deckCount, cardCount) => expect(generateShoe(deckCount)).toHaveLength(cardCount),
  );

  it('shuffle preserves composition', () => {
    const shoe = generateShoe(2);
    const shuffled = shuffleShoe(shoe, () => 0.25);
    expect(composition(shuffled)).toEqual(composition(shoe));
    expect(shuffled).not.toBe(shoe);
  });

  it.each([
    ['low', 1.5 / 52, -1],
    ['neutral', 6.5 / 52, 0],
    ['high', 9.5 / 52, 1],
  ] as const)('removing a %s card yields the expected ending count', (category, random, expectedEnding) => {
    const result = removeHiddenCard(generateShoe(1), () => random);
    expect(getHiLoCategory(result.hiddenCard)).toBe(category);
    expect(result.remainingCards).toHaveLength(51);
    expect(calculateRunningCount(result.remainingCards)).toBe(expectedEnding);
    const hiddenValue = getHiLoValue(result.hiddenCard);
    expect(calculateRunningCount(result.remainingCards)).toBe(hiddenValue === 0 ? 0 : -hiddenValue);
  });
});
