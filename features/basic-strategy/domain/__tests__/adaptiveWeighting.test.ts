import { calculateAdaptiveDealerWeights, calculateAdaptivePatternWeights, chooseAdaptiveDealerValue, chooseAdaptivePattern } from '../adaptiveWeighting';

const patterns = [
  { category: 'hard', value: 9, label: 'Hard 9' },
  { category: 'soft', value: 18, label: 'Soft 18' },
] as const;

describe('adaptive weighting', () => {
  const now = Date.parse('2026-08-13T12:00:00.000Z');
  it('weights unseen, incorrect, slow, and overdue patterns above mastered patterns', () => {
    const history = [
      { key: 'mastered', rules: 'H17', category: 'hard', patternLabel: 'Hard 9', dealerUpcardValue: '4', attempted: 10, correct: 10, totalResponseTimeMs: 10000, automaticAnswers: 10, lastPracticedAt: '2026-08-13T11:00:00.000Z' },
      { key: 'weak', rules: 'H17', category: 'soft', patternLabel: 'Soft 18', dealerUpcardValue: 'A', attempted: 4, correct: 1, totalResponseTimeMs: 20000, automaticAnswers: 0, lastPracticedAt: '2026-06-01T00:00:00.000Z' },
    ] as const;
    const weights = calculateAdaptivePatternWeights(patterns, 'H17', history, now);
    expect(weights[1].weight).toBeGreaterThan(weights[0].weight);
  });

  it('does not mix S17 history into H17 weighting and chooses deterministically', () => {
    const s17History = [{ key: 'x', rules: 'S17', category: 'hard', patternLabel: 'Hard 9', dealerUpcardValue: '2', attempted: 10, correct: 0, totalResponseTimeMs: 60000, automaticAnswers: 0, lastPracticedAt: '2020-01-01T00:00:00.000Z' }] as const;
    const weights = calculateAdaptivePatternWeights(patterns, 'H17', s17History, now);
    expect(weights[0].weight).toBe(6);
    expect(chooseAdaptivePattern(weights, () => 0)).toEqual(patterns[0]);
  });

  it('weights the exact hand-pattern plus dealer combination', () => {
    const history = [
      { key: 'weak', rules: 'H17', category: 'soft', patternLabel: 'Soft 18', dealerUpcardValue: 'A', attempted: 5, correct: 1, totalResponseTimeMs: 25000, automaticAnswers: 0, lastPracticedAt: '2026-06-01T00:00:00.000Z' },
      { key: 'mastered', rules: 'H17', category: 'soft', patternLabel: 'Soft 18', dealerUpcardValue: '2', attempted: 10, correct: 10, totalResponseTimeMs: 10000, automaticAnswers: 10, lastPracticedAt: '2026-08-13T11:00:00.000Z' },
    ] as const;
    const dealerWeights = calculateAdaptiveDealerWeights(patterns[1], 'H17', history, now);
    const ace = dealerWeights.find((entry) => entry.dealerValue === 'A')!;
    const two = dealerWeights.find((entry) => entry.dealerValue === '2')!;
    expect(ace.weight).toBeGreaterThan(two.weight);
    expect(chooseAdaptiveDealerValue(dealerWeights, () => 0)).toBe('2');
  });
});
