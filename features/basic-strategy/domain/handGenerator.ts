import { CARD_RANKS, CARD_SUITS, getCardValue, type CardRank, type PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { evaluateHand } from '@/lib/blackjack/handEvaluation';

import { ALL_HAND_PATTERNS, DEALER_UPCARD_VALUES, HARD_PATTERNS, PAIR_PATTERNS, SOFT_PATTERNS } from '../constants';
import { getBasicStrategyFeedback } from './strategyFeedback';
import type { BasicStrategyAction, BasicStrategyQuestion, BasicStrategyRules, HandCategory, HandPattern } from '../types';

type Random = () => number;
const TEN_VALUE_RANKS: CardRank[] = ['10', 'J', 'Q', 'K'];

function pick<T>(values: readonly T[], random: Random): T {
  return values[Math.floor(random() * values.length)];
}

function shuffled<T>(values: readonly T[], random: Random): T[] {
  return [...values]
    .map((value) => ({ value, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ value }) => value);
}

function rankForValue(value: number, random: Random): CardRank {
  return value === 11 ? 'A' : value === 10 ? pick(TEN_VALUE_RANKS, random) : String(value) as CardRank;
}

function randomCard(rank: CardRank, random: Random, excluded: readonly PlayingCardModel[] = []): PlayingCardModel {
  const availableSuits = CARD_SUITS.filter(
    (suit) => !excluded.some((card) => card.rank === rank && card.suit === suit),
  );
  return { rank, suit: pick(availableSuits, random) };
}

function hardCompositions(total: number): [number, number][] {
  const values: [number, number][] = [];
  for (let first = 2; first <= 10; first += 1) {
    const second = total - first;
    if (second >= 2 && second <= 10 && first < second) values.push([first, second]);
  }
  return values;
}

export function generateCardsForPattern(pattern: HandPattern, random: Random = Math.random): PlayingCardModel[] {
  if (pattern.category === 'soft') {
    const first = randomCard('A', random);
    const second = randomCard(rankForValue(pattern.value - 11, random), random, [first]);
    return shuffled([first, second], random);
  }

  if (pattern.category === 'pair') {
    const rank = rankForValue(pattern.value, random);
    const first = randomCard(rank, random);
    return [first, randomCard(rank, random, [first])];
  }

  const compositions = hardCompositions(pattern.value);
  if (compositions.length === 0) {
    const first = randomCard('A', random);
    return [first, randomCard(rankForValue(pattern.value - 1, random), random, [first])];
  }
  const [firstValue, secondValue] = pick(compositions, random);
  const first = randomCard(rankForValue(firstValue, random), random);
  return shuffled([first, randomCard(rankForValue(secondValue, random), random, [first])], random);
}

export function generateDealerUpcard(
  dealerValue: string | undefined,
  playerCards: readonly PlayingCardModel[],
  random: Random = Math.random,
): PlayingCardModel {
  const value = dealerValue ?? pick(DEALER_UPCARD_VALUES, random);
  const rank = value === 'A' ? 'A' : value === '10' ? pick(TEN_VALUE_RANKS, random) : value as CardRank;
  return randomCard(rank, random, playerCards);
}

export function patternsForCategory(category: HandCategory): HandPattern[] {
  return category === 'hard' ? HARD_PATTERNS : category === 'soft' ? SOFT_PATTERNS : PAIR_PATTERNS;
}

export function generateBasicStrategyQuestion(options: {
  rules: BasicStrategyRules;
  pattern?: HandPattern;
  category?: HandCategory;
  dealerValue?: string;
  random?: Random;
  now?: () => number;
}): BasicStrategyQuestion {
  const random = options.random ?? Math.random;
  const patterns = options.category ? patternsForCategory(options.category) : ALL_HAND_PATTERNS;
  const pattern = options.pattern ?? pick(patterns, random);
  const playerCards = generateCardsForPattern(pattern, random);
  const dealerUpcard = generateDealerUpcard(options.dealerValue, playerCards, random);
  const strategyFeedback = getBasicStrategyFeedback(playerCards, dealerUpcard, options.rules);
  const correctAction = strategyFeedback.correctAction;
  const hand = evaluateHand(playerCards);
  const availableActions: BasicStrategyAction[] = ['HIT', 'STAND', 'DOUBLE'];
  if (hand.isPair) availableActions.push('SPLIT');
  if (!hand.isSoft && hand.total >= 14 && hand.total <= 17) availableActions.push('SURRENDER');

  return {
    id: `${(options.now ?? Date.now)()}-${Math.floor(random() * 1_000_000)}`,
    playerCards,
    dealerUpcard,
    category: pattern.category,
    pattern,
    correctAction,
    strategyFeedback,
    availableActions,
  };
}

export function isPhysicallyPossibleQuestion(question: BasicStrategyQuestion): boolean {
  const cards = [...question.playerCards, question.dealerUpcard];
  const identities = cards.map((card) => `${card.rank}-${card.suit}`);
  return cards.every((card) => CARD_RANKS.includes(card.rank) && CARD_SUITS.includes(card.suit))
    && new Set(identities).size === identities.length;
}
