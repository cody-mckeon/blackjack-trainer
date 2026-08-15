import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { calculateRunningCount, getHiLoCategory } from '@/lib/blackjack/hiLo';
import { generateShuffledShoe, type DeckCount } from '@/lib/blackjack/shoe';

export interface CancellationChunk {
  cards: PlayingCardModel[];
  netValue: number;
  type: string;
}

export function getCancellationChunkType(cards: readonly PlayingCardModel[]): string {
  return cards.map(getHiLoCategory).sort().join('+');
}

export function createCancellationChunk(
  size: 2 | 3,
  deckCount: DeckCount,
  random: () => number = Math.random,
): CancellationChunk {
  const shoe = generateShuffledShoe(deckCount, random);
  const cards = shoe.slice(0, size);
  if (size === 3 && Math.abs(calculateRunningCount(cards)) === 3) {
    const neutral = shoe.find((card) => getHiLoCategory(card) === 'neutral');
    if (neutral) cards[2] = neutral;
  }
  return { cards, netValue: calculateRunningCount(cards), type: getCancellationChunkType(cards) };
}
