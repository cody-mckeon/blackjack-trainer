import { aggregateBasicStrategyRecords, aggregateCategoryPerformance, rankWeakestHands, updateBasicStrategyPerformance } from '../performance';
import { EMPTY_BASIC_STRATEGY_METRICS, recordBasicStrategyAnswer } from '../sessionMetrics';

const record = (overrides: Record<string, unknown> = {}) => ({
  answer: 'HIT', correctAction: 'HIT', isCorrect: true, responseTimeMs: 1000, responseSpeed: 'automatic', rules: 'H17', category: 'hard', patternLabel: 'Hard 9', dealerUpcardValue: '2', answeredAt: '2026-08-13T12:00:00.000Z', ...overrides,
} as any);

describe('basic strategy statistics', () => {
  it('tracks accuracy, streak, timing, and automatic percentage', () => {
    const first = recordBasicStrategyAnswer(EMPTY_BASIC_STRATEGY_METRICS, true, 1000);
    const second = recordBasicStrategyAnswer(first, false, 3000);
    expect(second).toMatchObject({ attempted: 2, correct: 1, accuracyPercentage: 50, currentStreak: 0, bestStreak: 1, averageResponseTimeMs: 2000, automaticPercentage: 50 });
  });

  it('aggregates category and weakest-hand performance', () => {
    const records = [record(), record({ category: 'soft', patternLabel: 'Soft 18', dealerUpcardValue: 'A', isCorrect: false, responseTimeMs: 5000, responseSpeed: 'needs-practice' })];
    const performance = aggregateBasicStrategyRecords(records);
    expect(aggregateCategoryPerformance(records)).toHaveLength(2);
    expect(rankWeakestHands(performance)[0]).toMatchObject({ patternLabel: 'Soft 18', dealerUpcardValue: 'A', accuracyPercentage: 0 });
  });

  it('stores H17 and S17 combinations separately', () => {
    let history = updateBasicStrategyPerformance([], record());
    history = updateBasicStrategyPerformance(history, record({ rules: 'S17' }));
    expect(history).toHaveLength(2);
    expect(new Set(history.map((entry) => entry.key))).toEqual(new Set(['H17|Hard 9|2', 'S17|Hard 9|2']));
  });
});
