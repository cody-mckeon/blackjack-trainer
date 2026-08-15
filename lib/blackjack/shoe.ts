import { CARD_RANKS, CARD_SUITS, type PlayingCardModel } from './cardTypes';

export const SUPPORTED_DECK_COUNTS = [1, 2, 4, 6, 8] as const;
export type DeckCount = (typeof SUPPORTED_DECK_COUNTS)[number];

export interface HiddenCardShoe {
  hiddenCard: PlayingCardModel;
  remainingCards: PlayingCardModel[];
}

export function generateShoe(deckCount: DeckCount): PlayingCardModel[] {
  const shoe: PlayingCardModel[] = [];
  for (let deck = 0; deck < deckCount; deck += 1) {
    for (const suit of CARD_SUITS) {
      for (const rank of CARD_RANKS) shoe.push({ rank, suit });
    }
  }
  return shoe;
}

export function shuffleShoe(
  cards: readonly PlayingCardModel[],
  random: () => number = Math.random,
): PlayingCardModel[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function generateShuffledShoe(deckCount: DeckCount, random: () => number = Math.random) {
  return shuffleShoe(generateShoe(deckCount), random);
}

export function removeHiddenCard(
  cards: readonly PlayingCardModel[],
  random: () => number = Math.random,
): HiddenCardShoe {
  if (cards.length === 0) throw new Error('Cannot remove a hidden card from an empty shoe.');
  const hiddenIndex = Math.min(cards.length - 1, Math.floor(random() * cards.length));
  return {
    hiddenCard: cards[hiddenIndex],
    remainingCards: [...cards.slice(0, hiddenIndex), ...cards.slice(hiddenIndex + 1)],
  };
}
