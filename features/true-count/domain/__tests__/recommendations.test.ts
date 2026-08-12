import type { DeckPerformanceSummary } from '../../types';
import { createSessionRecommendation } from '../recommendations';

function performance(
  decksRemaining: number,
  accuracyPercentage: number,
  averageResponseTimeMs: number,
  automaticPercentage = 0,
): DeckPerformanceSummary {
  return {
    decksRemaining,
    attempted: 10,
    correct: accuracyPercentage / 10,
    totalResponseTimeMs: averageResponseTimeMs * 10,
    automaticAnswers: automaticPercentage / 10,
    lastPracticedAt: '2026-08-12T12:00:00.000Z',
    accuracyPercentage,
    averageResponseTimeMs,
    automaticPercentage,
    runningCounts: {},
  };
}

describe('createSessionRecommendation', () => {
  it('recommends Pattern Recall for low accuracy', () => {
    expect(createSessionRecommendation([performance(3.5, 70, 4_200)])).toBe(
      'Practice 3.5 decks remaining in Pattern Recall.',
    );
  });

  it('recommends a speed target when accuracy is strong', () => {
    expect(createSessionRecommendation([performance(2.5, 90, 3_800)])).toBe(
      'Your accuracy is strong. Get 2.5-deck conversions under 3 seconds.',
    );
  });

  it('recognizes an automatic pattern', () => {
    expect(createSessionRecommendation([performance(2, 100, 1_000, 90)])).toBe(
      'You are already automatic at 2 decks remaining.',
    );
  });
});
