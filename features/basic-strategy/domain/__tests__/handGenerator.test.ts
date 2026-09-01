import { evaluateHand } from '@/lib/blackjack/handEvaluation';
import { generateBasicStrategyQuestion, generateCardsForPattern, isPhysicallyPossibleQuestion } from '../handGenerator';

describe('basic strategy hand generation', () => {
  it('generates varied valid compositions for a hard total without leaking pairs into the category', () => {
    const outputs = new Set<string>();
    for (let index = 0; index < 100; index += 1) {
      const cards = generateCardsForPattern({ category: 'hard', value: 12, label: 'Hard 12' });
      expect(evaluateHand(cards)).toMatchObject({ total: 12, isSoft: false, isPair: false });
      outputs.add(cards.map((card) => card.rank).sort().join('+'));
    }
    expect(outputs.size).toBeGreaterThan(1);
  });

  it('generates soft totals and exact-rank pairs', () => {
    const soft = generateCardsForPattern({ category: 'soft', value: 18, label: 'Soft 18' });
    expect(evaluateHand(soft)).toMatchObject({ total: 18, isSoft: true });
    const pair = generateCardsForPattern({ category: 'pair', value: 10, label: 'Pair of 10s' });
    expect(pair[0].rank).toBe(pair[1].rank);
    expect(evaluateHand(pair).isPair).toBe(true);
  });

  it('never generates the same physical card twice', () => {
    for (let index = 0; index < 500; index += 1) {
      expect(isPhysicallyPossibleQuestion(generateBasicStrategyQuestion({ rules: index % 2 ? 'H17' : 'S17' }))).toBe(true);
    }
  });

  it('does not offer surrender for a soft hand', () => {
    const question = generateBasicStrategyQuestion({ rules: 'S17', pattern: { category: 'soft', value: 17, label: 'Soft 17' }, dealerValue: '5' });
    expect(question.availableActions).not.toContain('SURRENDER');
  });
});
