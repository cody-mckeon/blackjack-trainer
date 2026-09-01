import { CARDS_PER_DECK } from '../constants';

export function calculateDecksPlayed(startingDecks: number, decksRemaining: number): number {
  return Math.max(0, startingDecks - decksRemaining);
}

export function calculateDiscardedCardCount(startingDecks: number, decksRemaining: number): number {
  return Math.round(calculateDecksPlayed(startingDecks, decksRemaining) * CARDS_PER_DECK);
}

export function calculateDecksPlayedFromDiscardedCards(discardedCardCount: number): number {
  return Math.max(0, discardedCardCount) / CARDS_PER_DECK;
}

export function calculateDecksRemaining(startingDecks: number, discardedCardCount: number): number {
  return Math.max(0, startingDecks - calculateDecksPlayedFromDiscardedCards(discardedCardCount));
}

export function generateCalibrationValues(
  startingDecks: number,
  increment = 0.5,
  minimum = 1,
  maximum = startingDecks,
): number[] {
  if (increment <= 0) throw new Error('Deck increment must be greater than zero.');

  const lowerBound = Math.max(0, minimum);
  const upperBound = Math.min(startingDecks, maximum);
  const values: number[] = [];

  for (let value = startingDecks; value >= lowerBound - Number.EPSILON; value -= increment) {
    if (value <= upperBound + Number.EPSILON) values.push(Number(value.toFixed(4)));
  }

  return values;
}
