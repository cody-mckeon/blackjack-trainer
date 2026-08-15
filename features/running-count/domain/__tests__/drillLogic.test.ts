import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';

import { createCancellationChunk } from '../cancellation';
import { generateCheckpointPositions, getRunningCountAtCheckpoint, summarizeCheckpointResults } from '../checkpoints';

const cards: PlayingCardModel[] = [
  { rank: '2', suit: 'clubs' },
  { rank: 'K', suit: 'hearts' },
  { rank: '5', suit: 'spades' },
  { rank: '8', suit: 'diamonds' },
];

describe('running count drill logic', () => {
  it('generates deterministic fixed and random checkpoints', () => {
    expect(generateCheckpointPositions(52, 10)).toEqual([10, 20, 30, 40, 50]);
    expect(generateCheckpointPositions(20, 'random', () => 0)).toEqual([5, 10, 15]);
  });

  it('calculates checkpoint counts and diagnostic streaks', () => {
    expect(getRunningCountAtCheckpoint(cards, 1)).toBe(1);
    expect(getRunningCountAtCheckpoint(cards, 3)).toBe(1);
    expect(summarizeCheckpointResults([
      { cardPosition: 5, userAnswer: 1, actualCount: 1, isCorrect: true, responseTimeMs: 100 },
      { cardPosition: 10, userAnswer: 2, actualCount: 1, isCorrect: false, responseTimeMs: 200 },
      { cardPosition: 15, userAnswer: 0, actualCount: 0, isCorrect: true, responseTimeMs: 100 },
    ])).toEqual({ correct: 2, firstIncorrectCheckpoint: 10, currentStreak: 1, longestCorrectStreak: 1 });
  });

  it('generates cancellation totals from the displayed cards', () => {
    const chunk = createCancellationChunk(3, 1, () => 0.2);
    expect(chunk.cards).toHaveLength(3);
    expect(chunk.netValue).toBe(getRunningCountAtCheckpoint(chunk.cards, 3));
    expect(chunk.type.split('+')).toHaveLength(3);
  });
});
