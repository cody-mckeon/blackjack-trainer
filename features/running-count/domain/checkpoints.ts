import { calculateRunningCount } from '@/lib/blackjack/hiLo';
import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';

import type { CheckpointFrequency, CheckpointResult } from '../types';

export function generateCheckpointPositions(
  cardCount: number,
  frequency: CheckpointFrequency,
  random: () => number = Math.random,
): number[] {
  if (cardCount <= 1) return [];
  const finalEligiblePosition = cardCount - 1;
  if (frequency !== 'random') {
    const positions: number[] = [];
    for (let position = frequency; position <= finalEligiblePosition; position += frequency) positions.push(position);
    return positions;
  }

  const positions: number[] = [];
  let position = 5 + Math.floor(random() * 6);
  while (position <= finalEligiblePosition) {
    positions.push(position);
    position += 5 + Math.floor(random() * 11);
  }
  return positions;
}

export function getRunningCountAtCheckpoint(cards: readonly PlayingCardModel[], cardPosition: number): number {
  return calculateRunningCount(cards.slice(0, Math.max(0, cardPosition)));
}

export function summarizeCheckpointResults(results: readonly CheckpointResult[]) {
  let streak = 0;
  let longestCorrectStreak = 0;
  for (const result of results) {
    streak = result.isCorrect ? streak + 1 : 0;
    longestCorrectStreak = Math.max(longestCorrectStreak, streak);
  }
  return {
    correct: results.filter((result) => result.isCorrect).length,
    firstIncorrectCheckpoint: results.find((result) => !result.isCorrect)?.cardPosition,
    currentStreak: streak,
    longestCorrectStreak,
  };
}
