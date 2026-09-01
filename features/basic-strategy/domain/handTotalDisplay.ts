import { formatCard, type PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { getHandClassification } from '@/lib/blackjack/handEvaluation';
import type { HandTotalDisplay } from '../types';

export function shouldShowHandTotal(mode: HandTotalDisplay, hasAnswered: boolean): boolean {
  return mode === 'before' || (mode === 'after' && hasAnswered);
}

export function formatHandReveal(cards: readonly PlayingCardModel[]): string {
  return `${cards.map(formatCard).join(' + ')} = ${getHandClassification(cards)}`;
}
