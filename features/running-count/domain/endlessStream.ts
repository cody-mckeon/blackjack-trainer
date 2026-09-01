import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { generateShuffledShoe, type DeckCount } from '@/lib/blackjack/shoe';

export interface EndlessCardStream {
  next(): PlayingCardModel;
}

export function createEndlessCardStream(deckCount: DeckCount, random: () => number = Math.random): EndlessCardStream {
  let shoe = generateShuffledShoe(deckCount, random);
  let index = 0;
  return {
    next() {
      if (index >= shoe.length) {
        shoe = generateShuffledShoe(deckCount, random);
        index = 0;
      }
      const card = shoe[index];
      index += 1;
      return card;
    },
  };
}
