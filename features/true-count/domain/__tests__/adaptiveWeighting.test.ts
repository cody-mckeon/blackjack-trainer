import { DEFAULT_TRUE_COUNT_SETTINGS } from '../../constants';
import type { DeckPerformanceStats } from '../../types';
import {
  calculateAdaptiveRunningCountWeights,
  calculateAdaptiveWeights,
  chooseWeightedDeckValue,
} from '../adaptiveWeighting';

const NOW = Date.parse('2026-08-12T12:00:00.000Z');

function stats(
  decksRemaining: number,
  correct: number,
  attempted: number,
  averageResponseTimeMs: number,
  lastPracticedAt = '2026-08-12T11:00:00.000Z',
): DeckPerformanceStats {
  return {
    decksRemaining,
    correct,
    attempted,
    totalResponseTimeMs: averageResponseTimeMs * attempted,
    automaticAnswers: 0,
    lastPracticedAt,
    runningCounts: {},
  };
}

describe('adaptive weighting', () => {
  const settings = { ...DEFAULT_TRUE_COUNT_SETTINGS, shoeSize: 6 as const };

  it('gives weak and slow deck values more weight', () => {
    const history = [stats(3.5, 5, 10, 5_000), stats(2, 10, 10, 1_000)];
    const weights = calculateAdaptiveWeights(settings, history, NOW);
    const weak = weights.find((entry) => entry.decksRemaining === 3.5)!;
    const strong = weights.find((entry) => entry.decksRemaining === 2)!;

    expect(weak.weight).toBeGreaterThan(strong.weight);
  });

  it('discounts strong, fast scenarios', () => {
    const history = [stats(5.5, 10, 10, 1_000), stats(3.5, 8, 10, 3_500)];
    const weights = calculateAdaptiveWeights(settings, history, NOW);

    expect(weights.find((entry) => entry.decksRemaining === 5.5)!.weight).toBeLessThan(1);
    expect(weights.find((entry) => entry.decksRemaining === 3.5)!.weight).toBeGreaterThan(1);
  });

  it('includes half-deck values and boosts unpracticed scenarios', () => {
    const weights = calculateAdaptiveWeights(settings, [], NOW);

    expect(weights.find((entry) => entry.decksRemaining === 5.5)).toEqual({ decksRemaining: 5.5, weight: 6 });
  });

  it('selects deterministically for an injected random value', () => {
    const weighted = [
      { decksRemaining: 3.5, weight: 5 },
      { decksRemaining: 2, weight: 1 },
    ];

    expect(chooseWeightedDeckValue(weighted, () => 0)).toBe(3.5);
    expect(chooseWeightedDeckValue(weighted, () => 0.99)).toBe(2);
  });

  it('increases the weight of a weak running-count combination', () => {
    const deckStats = stats(3.5, 15, 20, 2_500);
    deckStats.runningCounts = {
      '10': {
        runningCount: 10,
        attempted: 10,
        correct: 5,
        totalResponseTimeMs: 50_000,
        lastPracticedAt: '2026-08-12T11:00:00.000Z',
      },
      '7': {
        runningCount: 7,
        attempted: 10,
        correct: 10,
        totalResponseTimeMs: 10_000,
        lastPracticedAt: '2026-08-12T11:00:00.000Z',
      },
    };

    const weights = calculateAdaptiveRunningCountWeights(settings, 3.5, [deckStats], NOW);
    expect(weights.find((entry) => entry.runningCount === 10)!.weight).toBeGreaterThan(
      weights.find((entry) => entry.runningCount === 7)!.weight,
    );
  });

  it('only weights running counts that are realistic for the point in the shoe', () => {
    const eightDeckSettings = { ...DEFAULT_TRUE_COUNT_SETTINGS, shoeSize: 8 as const };
    const weights = calculateAdaptiveRunningCountWeights(eightDeckSettings, 7.5, [], NOW);

    expect(weights[0].runningCount).toBe(-10);
    expect(weights.at(-1)?.runningCount).toBe(10);
    expect(weights).toHaveLength(21);
  });
});
