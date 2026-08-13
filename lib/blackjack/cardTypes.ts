export const CARD_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const CARD_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

export type CardRank = (typeof CARD_RANKS)[number];
export type CardSuit = (typeof CARD_SUITS)[number];

export interface PlayingCardModel {
  rank: CardRank;
  suit: CardSuit;
}

export const SUIT_SYMBOLS: Record<CardSuit, '♠' | '♥' | '♦' | '♣'> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export function isCardRank(value: unknown): value is CardRank {
  return CARD_RANKS.includes(value as CardRank);
}

export function isCardSuit(value: unknown): value is CardSuit {
  return CARD_SUITS.includes(value as CardSuit);
}

export function getCardValue(rank: CardRank): number {
  if (rank === 'A') return 11;
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10;
  return Number(rank);
}

export function getCardKey(card: PlayingCardModel): string {
  return `${card.rank}-${card.suit}`;
}

export function formatCard(card: PlayingCardModel): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}
