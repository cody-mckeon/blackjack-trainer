import { classifyDeckEstimationResponseSpeed } from '../responseSpeed';
import {
  aggregateDeckEstimatePerformance,
  EMPTY_DECK_ESTIMATION_METRICS,
  findMostCommonConfusions,
  recordDeckEstimationAnswer,
} from '../statistics';
import type { DeckEstimationAnswerRecord } from '../../types';

function answer(overrides: Partial<DeckEstimationAnswerRecord>): DeckEstimationAnswerRecord {
  return {
    startingDecks: 6,
    decksPlayed: 2.5,
    discardedCardCount: 130,
    correctAnswer: 3.5,
    answer: 3.5,
    isCorrect: true,
    responseTimeMs: 1_000,
    responseSpeed: 'automatic',
    answeredAt: '2026-08-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('deck estimation statistics', () => {
  it('classifies response speeds at configured boundaries', () => {
    expect(classifyDeckEstimationResponseSpeed(1_499)).toBe('automatic');
    expect(classifyDeckEstimationResponseSpeed(1_500)).toBe('fast');
    expect(classifyDeckEstimationResponseSpeed(3_000)).toBe('calculating');
    expect(classifyDeckEstimationResponseSpeed(5_000)).toBe('needs-practice');
  });

  it('tracks session accuracy, streaks, time, and automatic answers', () => {
    const first = recordDeckEstimationAnswer(EMPTY_DECK_ESTIMATION_METRICS, true, 1_000);
    const second = recordDeckEstimationAnswer(first, false, 4_000);
    expect(second).toMatchObject({ attempted: 2, correct: 1, bestStreak: 1, currentStreak: 0 });
    expect(second.accuracyPercentage).toBe(50);
    expect(second.averageResponseTimeMs).toBe(2_500);
    expect(second.automaticPercentage).toBe(50);
  });

  it('aggregates weak estimates and their most common wrong answer', () => {
    const performance = aggregateDeckEstimatePerformance([
      answer({}),
      answer({ answer: 4, isCorrect: false, responseTimeMs: 4_000, responseSpeed: 'calculating' }),
      answer({ answer: 4, isCorrect: false, responseTimeMs: 3_000, responseSpeed: 'calculating' }),
    ]);
    expect(performance[0]).toMatchObject({ attempted: 3, correct: 1, mostCommonWrongAnswer: 4 });
  });

  it('ranks confusion pairs by frequency', () => {
    const confusions = findMostCommonConfusions([
      answer({ answer: 4, isCorrect: false }),
      answer({ answer: 4, isCorrect: false }),
      answer({ correctAnswer: 3, answer: 2.5, isCorrect: false }),
    ]);
    expect(confusions[0]).toEqual({ expected: 3.5, answered: 4, count: 2 });
  });
});
