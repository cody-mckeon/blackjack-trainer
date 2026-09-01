import { getCardValue, type CardRank, type PlayingCardModel } from './cardTypes';

export interface EvaluatedHand {
  total: number;
  isSoft: boolean;
  isHard: boolean;
  isPair: boolean;
  pairRank: CardRank | null;
  pairValue: number | null;
  isBlackjack: boolean;
  isBust: boolean;
}

export function evaluateHand(cards: readonly PlayingCardModel[]): EvaluatedHand {
  let total = cards.reduce((sum, card) => sum + getCardValue(card.rank), 0);
  let acesCountedAsEleven = cards.filter((card) => card.rank === 'A').length;

  while (total > 21 && acesCountedAsEleven > 0) {
    total -= 10;
    acesCountedAsEleven -= 1;
  }

  const isPair = cards.length === 2 && cards[0].rank === cards[1].rank;
  const pairRank = isPair ? cards[0].rank : null;

  return {
    total,
    isSoft: acesCountedAsEleven > 0,
    isHard: acesCountedAsEleven === 0,
    isPair,
    pairRank,
    pairValue: pairRank ? getCardValue(pairRank) : null,
    isBlackjack: cards.length === 2 && total === 21 && cards.some((card) => card.rank === 'A'),
    isBust: total > 21,
  };
}

export function getHandClassification(cards: readonly PlayingCardModel[]): string {
  const hand = evaluateHand(cards);
  const totalLabel = `${hand.isSoft ? 'Soft' : 'Hard'} ${hand.total}`;

  if (!hand.isPair || !hand.pairRank) return totalLabel;

  const rankLabel = hand.pairValue === 10 ? '10s' : hand.pairRank === 'A' ? 'Aces' : `${hand.pairRank}s`;
  return `Pair of ${rankLabel} / ${totalLabel}`;
}
