import { evaluateHand, getHandClassification } from '../handEvaluation';

const card = (rank: 'A' | '2' | '4' | '6' | '7' | '8' | '9' | '10', suit: 'spades' | 'hearts' | 'diamonds' = 'spades') => ({ rank, suit } as const);

describe('evaluateHand', () => {
  it('evaluates hard hands', () => {
    expect(evaluateHand([card('8'), card('4', 'hearts')])).toMatchObject({ total: 12, isHard: true, isSoft: false });
  });

  it('evaluates soft hands', () => {
    expect(evaluateHand([card('A'), card('7', 'hearts')])).toMatchObject({ total: 18, isSoft: true, isHard: false });
  });

  it('converts as many Aces from eleven to one as needed in a multi-card hand', () => {
    expect(evaluateHand([card('A'), card('A', 'hearts'), card('9', 'diamonds'), card('6')])).toMatchObject({ total: 17, isSoft: false, isBust: false });
    expect(evaluateHand([card('A'), card('6'), card('10', 'hearts')])).toMatchObject({ total: 17, isSoft: false });
  });

  it('recognizes exact-rank pairs and not merely equal-value cards', () => {
    expect(evaluateHand([card('9'), card('9', 'hearts')])).toMatchObject({ isPair: true, pairRank: '9', pairValue: 9 });
    expect(evaluateHand([card('10'), { rank: 'K', suit: 'hearts' }])).toMatchObject({ isPair: false });
    expect(getHandClassification([card('9'), card('9', 'hearts')])).toBe('Pair of 9s / Hard 18');
  });

  it('recognizes natural blackjack', () => {
    expect(evaluateHand([card('A'), card('10', 'hearts')]).isBlackjack).toBe(true);
    expect(evaluateHand([card('A'), card('4'), card('6')]).isBlackjack).toBe(false);
  });
});
