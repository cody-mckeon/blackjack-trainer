import type { CardRank, PlayingCardModel } from './cardTypes';

export type HiLoValue = -1 | 0 | 1;
export type HiLoCategory = 'low' | 'neutral' | 'high';

const HI_LO_VALUES: Record<CardRank, HiLoValue> = {
  A: -1,
  '2': 1,
  '3': 1,
  '4': 1,
  '5': 1,
  '6': 1,
  '7': 0,
  '8': 0,
  '9': 0,
  '10': -1,
  J: -1,
  Q: -1,
  K: -1,
};

export function getHiLoValue(cardOrRank: PlayingCardModel | CardRank): HiLoValue {
  return HI_LO_VALUES[typeof cardOrRank === 'string' ? cardOrRank : cardOrRank.rank];
}

export function calculateRunningCount(cards: readonly PlayingCardModel[]): number {
  return cards.reduce((count, card) => count + getHiLoValue(card), 0);
}

export function getHiLoCategory(cardOrRank: PlayingCardModel | CardRank): HiLoCategory {
  const value = getHiLoValue(cardOrRank);
  return value === 1 ? 'low' : value === -1 ? 'high' : 'neutral';
}

export function getHiddenCategoryFromEndingCount(endingCount: number): HiLoCategory | null {
  if (endingCount === -1) return 'low';
  if (endingCount === 0) return 'neutral';
  if (endingCount === 1) return 'high';
  return null;
}
