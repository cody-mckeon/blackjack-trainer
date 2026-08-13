import { evaluateHand } from '@/lib/blackjack/handEvaluation';
import { getCardValue, type PlayingCardModel } from '@/lib/blackjack/cardTypes';

import { BASIC_STRATEGY_TABLE_RULES } from '../constants';
import { H17_STRATEGY_TABLE } from '../strategyTables/h17';
import { S17_STRATEGY_TABLE } from '../strategyTables/s17';
import type { DealerValue, StrategyTable } from '../strategyTables/tableTypes';
import type {
  BasicStrategyAction,
  BasicStrategyRules,
  StrategyAvailability,
  StrategyInstruction,
} from '../types';

export const DEFAULT_STRATEGY_AVAILABILITY: StrategyAvailability = {
  canDouble: true,
  canSplit: true,
  canSurrender: true,
  doubleAfterSplit: BASIC_STRATEGY_TABLE_RULES.doubleAfterSplit,
};

export function getDealerValue(card: PlayingCardModel): DealerValue {
  if (card.rank === 'A') return 'A';
  const value = getCardValue(card.rank);
  return value === 10 ? '10' : String(value) as DealerValue;
}

function resolveInstruction(
  instruction: StrategyInstruction,
  availability: StrategyAvailability,
  fallbackAction: BasicStrategyAction,
): BasicStrategyAction {
  if (instruction === 'DOUBLE_OR_HIT') return availability.canDouble ? 'DOUBLE' : 'HIT';
  if (instruction === 'DOUBLE_OR_STAND') return availability.canDouble ? 'DOUBLE' : 'STAND';
  if (instruction === 'SPLIT_IF_DAS') {
    return availability.canSplit && availability.doubleAfterSplit ? 'SPLIT' : fallbackAction;
  }
  if (instruction === 'NO_SPLIT') return fallbackAction;
  if (instruction === 'SPLIT' && !availability.canSplit) return fallbackAction;
  return instruction;
}

function getTotalInstruction(table: StrategyTable, cards: readonly PlayingCardModel[], dealer: DealerValue) {
  const hand = evaluateHand(cards);
  if (hand.total <= 8) return 'HIT' as const;
  if (hand.total >= 17 && !hand.isSoft) return 'STAND' as const;
  if (hand.isSoft && hand.total >= 20) return 'STAND' as const;
  return (hand.isSoft ? table.soft[hand.total] : table.hard[hand.total])?.[dealer] ?? 'HIT';
}

export function getBasicStrategyAction(
  playerHand: readonly PlayingCardModel[],
  dealerUpcard: PlayingCardModel,
  rules: BasicStrategyRules,
  availabilityOverrides: Partial<StrategyAvailability> = {},
): BasicStrategyAction {
  const availability = { ...DEFAULT_STRATEGY_AVAILABILITY, ...availabilityOverrides };
  const table = rules === 'H17' ? H17_STRATEGY_TABLE : S17_STRATEGY_TABLE;
  const dealer = getDealerValue(dealerUpcard);
  const hand = evaluateHand(playerHand);

  if (availability.canSurrender && BASIC_STRATEGY_TABLE_RULES.lateSurrender) {
    const hardSurrender = !hand.isPair && !hand.isSoft && table.surrender.hard[hand.total]?.includes(dealer);
    const pairSurrender = hand.isPair && hand.pairValue
      ? table.surrender.pairs[hand.pairValue]?.includes(dealer)
      : false;
    if (hardSurrender || pairSurrender) return 'SURRENDER';
  }

  const totalInstruction = getTotalInstruction(table, playerHand, dealer);
  if (hand.isPair && hand.pairValue) {
    const pairInstruction = table.pairs[hand.pairValue]?.[dealer];
    if (pairInstruction) {
      const fallback = resolveInstruction(totalInstruction, availability, 'HIT');
      return resolveInstruction(pairInstruction, availability, fallback);
    }
  }

  return resolveInstruction(totalInstruction, availability, 'HIT');
}
