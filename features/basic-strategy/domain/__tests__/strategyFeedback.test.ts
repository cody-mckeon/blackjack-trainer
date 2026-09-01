import { ALL_HAND_PATTERNS, DEALER_UPCARD_VALUES } from '../../constants';
import { generateBasicStrategyQuestion } from '../handGenerator';
import { getAnsweredStrategyFeedback, getBasicStrategyFeedback } from '../strategyFeedback';

const c = (rank: any, suit: any = 'spades') => ({ rank, suit });

describe('basic strategy feedback', () => {
  it('returns a non-empty pattern explanation for every generated pattern, dealer upcard, and rule set', () => {
    for (const rules of ['H17', 'S17'] as const) {
      for (const pattern of ALL_HAND_PATTERNS) {
        for (const dealerValue of DEALER_UPCARD_VALUES) {
          const question = generateBasicStrategyQuestion({ rules, pattern, dealerValue });
          expect(question.strategyFeedback.patternExplanation.length).toBeGreaterThan(0);
          expect(question.strategyFeedback.patternLabel).toBe(pattern.label);
          expect(question.strategyFeedback.correctAction).toBe(question.correctAction);
          expect(question.strategyFeedback.activeRules).toBe(rules);
        }
      }
    }
  });

  it('explains Hard 12 completely', () => {
    const feedback = getBasicStrategyFeedback([c('7'), c('5', 'hearts')], c('2'), 'H17');
    expect(feedback).toMatchObject({
      handClassification: '7♠ + 5♥ = Hard 12',
      correctAction: 'HIT',
      patternLabel: 'Hard 12',
      patternExplanation: 'Hard 12: Stand 4–6; otherwise Hit',
    });
  });

  it('always reinforces the full Hard 16 surrender pattern', () => {
    const feedback = getBasicStrategyFeedback([c('10'), c('6', 'hearts')], c('10'), 'H17');
    expect(feedback.correctAction).toBe('SURRENDER');
    expect(feedback.patternExplanation).toBe('Hard 16: Surrender 9–Ace; Stand 2–6; otherwise Hit');
  });

  it('explains Soft 18 under both rule sets', () => {
    const h17 = getBasicStrategyFeedback([c('A'), c('7', 'diamonds')], c('2'), 'H17');
    const s17 = getBasicStrategyFeedback([c('A'), c('7', 'diamonds')], c('2'), 'S17');
    expect(h17.correctAction).toBe('DOUBLE');
    expect(s17.correctAction).toBe('STAND');
    expect(h17.patternExplanation).toBe('Soft 18: Double 2–6 if allowed (otherwise Stand); Stand 7–8; otherwise Hit');
    expect(s17.patternExplanation).toBe('Soft 18: Double 3–6 if allowed (otherwise Stand); Stand 2 and 7–8; otherwise Hit');
    expect(h17.ruleCaveat).toBe('H17 chart pattern.');
    expect(s17.ruleCaveat).toBe('S17 chart pattern.');
  });

  it('explains the Soft 19 H17/S17 difference', () => {
    const h17 = getBasicStrategyFeedback([c('A'), c('8', 'diamonds')], c('6'), 'H17');
    const s17 = getBasicStrategyFeedback([c('A'), c('8', 'diamonds')], c('6'), 'S17');
    expect(h17).toMatchObject({ correctAction: 'DOUBLE', patternExplanation: 'Soft 19: Double 6 if allowed; otherwise Stand', ruleCaveat: 'H17 chart pattern.' });
    expect(s17).toMatchObject({ correctAction: 'STAND', patternExplanation: 'Soft 19: Always Stand', ruleCaveat: 'S17 chart pattern.' });
  });

  it('never applies hard-total surrender rows to soft totals', () => {
    const soft15 = getBasicStrategyFeedback([c('A'), c('4', 'hearts')], c('10'), 'S17');
    expect(soft15.correctAction).toBe('HIT');
    expect(soft15.patternExplanation).toBe('Soft 15: Double 4–6 if allowed; otherwise Hit');
    expect(soft15.patternExplanation).not.toContain('Surrender');
  });

  it('explains Pair of 9s and Pair of 8s', () => {
    const nines = getBasicStrategyFeedback([c('9'), c('9', 'hearts')], c('7'), 'H17');
    expect(nines).toMatchObject({
      handClassification: '9♠ + 9♥ = Pair of 9s',
      correctAction: 'STAND',
      patternExplanation: 'Pair of 9s: Split 2–6 and 8–9; otherwise Stand',
    });
    const h17Eights = getBasicStrategyFeedback([c('8'), c('8', 'hearts')], c('A'), 'H17');
    const s17Eights = getBasicStrategyFeedback([c('8'), c('8', 'hearts')], c('A'), 'S17');
    expect(h17Eights).toMatchObject({ correctAction: 'SURRENDER', patternExplanation: 'Pair of 8s: Surrender Ace; Split 2–10' });
    expect(s17Eights).toMatchObject({ correctAction: 'SPLIT', patternExplanation: 'Pair of 8s: Always Split' });
  });

  it('shows surrender, double, and DAS fallbacks without omitting the source rule', () => {
    const surrenderFallback = getBasicStrategyFeedback([c('10'), c('6', 'hearts')], c('10'), 'H17', { canSurrender: false });
    expect(surrenderFallback.correctAction).toBe('HIT');
    expect(surrenderFallback.patternExplanation).toContain('Surrender 9–Ace');
    expect(surrenderFallback.ruleCaveat).toContain('Late surrender is unavailable');

    const doubleFallback = getBasicStrategyFeedback([c('5'), c('4', 'hearts')], c('3'), 'H17', { canDouble: false });
    expect(doubleFallback.correctAction).toBe('HIT');
    expect(doubleFallback.patternExplanation).toContain('Double 3–6 if allowed');
    expect(doubleFallback.ruleCaveat).toContain('Doubling is unavailable');

    const dasFallback = getBasicStrategyFeedback([c('4'), c('4', 'hearts')], c('5'), 'H17', { doubleAfterSplit: false });
    expect(dasFallback.correctAction).toBe('HIT');
    expect(dasFallback.patternExplanation).toContain('only with DAS');
    expect(dasFallback.ruleCaveat).toContain('DAS is unavailable');
  });

  it('uses identical decision reinforcement for correct and incorrect answer states', () => {
    const decision = getBasicStrategyFeedback([c('7'), c('5', 'hearts')], c('4'), 'H17');
    const correct = getAnsweredStrategyFeedback(decision, decision.correctAction);
    const incorrect = getAnsweredStrategyFeedback(decision, 'HIT');
    expect(correct.isCorrect).toBe(true);
    expect(incorrect.isCorrect).toBe(false);
    expect(incorrect.patternExplanation).toBe(correct.patternExplanation);
    expect(incorrect.handClassification).toBe(correct.handClassification);
    expect(incorrect.activeRules).toBe(correct.activeRules);
  });
});
