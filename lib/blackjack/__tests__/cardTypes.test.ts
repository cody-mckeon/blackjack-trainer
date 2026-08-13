import { CARD_RANKS, CARD_SUITS, formatCard, getCardValue, isCardRank, isCardSuit } from '../cardTypes';

describe('visual card model', () => {
  it('supports all required ranks and suits', () => {
    expect(CARD_RANKS).toEqual(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);
    expect(CARD_SUITS).toEqual(['spades', 'hearts', 'diamonds', 'clubs']);
    expect(isCardRank('Q')).toBe(true);
    expect(isCardSuit('diamonds')).toBe(true);
    expect(isCardRank('1')).toBe(false);
  });

  it('maps face cards and formats suit symbols', () => {
    expect(getCardValue('A')).toBe(11);
    expect(getCardValue('K')).toBe(10);
    expect(formatCard({ rank: '7', suit: 'hearts' })).toBe('7♥');
  });
});
