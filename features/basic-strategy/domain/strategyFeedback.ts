import { formatCard, type PlayingCardModel } from '@/lib/blackjack/cardTypes';
import { evaluateHand } from '@/lib/blackjack/handEvaluation';

import { H17_STRATEGY_TABLE } from '../strategyTables/h17';
import { S17_STRATEGY_TABLE } from '../strategyTables/s17';
import type { DealerValue, StrategyTable } from '../strategyTables/tableTypes';
import type {
  BasicStrategyDecisionFeedback,
  BasicStrategyRules,
  StrategyAvailability,
  StrategyInstruction,
} from '../types';
import { DEFAULT_STRATEGY_AVAILABILITY, getBasicStrategyAction } from './strategyLookup';

type ExplanationInstruction = StrategyInstruction | 'SURRENDER';
const DEALERS: DealerValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

function getTable(rules: BasicStrategyRules): StrategyTable {
  return rules === 'H17' ? H17_STRATEGY_TABLE : S17_STRATEGY_TABLE;
}

function getTotalInstruction(table: StrategyTable, cards: readonly PlayingCardModel[], dealer: DealerValue): StrategyInstruction {
  const hand = evaluateHand(cards);
  if (hand.total <= 8) return 'HIT';
  if (hand.total >= 17 && !hand.isSoft) return 'STAND';
  if (hand.isSoft && hand.total >= 20) return 'STAND';
  return (hand.isSoft ? table.soft[hand.total] : table.hard[hand.total])?.[dealer] ?? 'HIT';
}

function getSourceInstruction(
  table: StrategyTable,
  cards: readonly PlayingCardModel[],
  dealer: DealerValue,
): ExplanationInstruction {
  const hand = evaluateHand(cards);
  const isSurrender = hand.isPair && hand.pairValue
    ? table.surrender.pairs[hand.pairValue]?.includes(dealer)
    : !hand.isSoft && table.surrender.hard[hand.total]?.includes(dealer);
  if (isSurrender) return 'SURRENDER';

  const totalInstruction = getTotalInstruction(table, cards, dealer);
  if (!hand.isPair || !hand.pairValue) return totalInstruction;
  const pairInstruction = table.pairs[hand.pairValue]?.[dealer];
  return pairInstruction === 'NO_SPLIT' || !pairInstruction ? totalInstruction : pairInstruction;
}

function formatDealerSet(values: readonly DealerValue[]): string {
  const parts: string[] = [];
  const numeric = values.filter((value) => value !== 'A').map(Number).sort((a, b) => a - b);
  let start = numeric[0];
  let previous = numeric[0];

  for (let index = 1; index <= numeric.length; index += 1) {
    const current = numeric[index];
    if (current === previous + 1) {
      previous = current;
      continue;
    }
    if (start !== undefined) parts.push(start === previous ? String(start) : `${start}–${previous}`);
    start = current;
    previous = current;
  }
  if (values.includes('A') && numeric[numeric.length - 1] === 10) {
    const last = parts.pop();
    parts.push(last === '10' ? '10–Ace' : last?.replace(/–10$/, '–Ace') ?? 'Ace');
  } else if (values.includes('A')) {
    parts.push('Ace');
  }
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, ${parts[parts.length - 1]}`;
}

function groupInstructions(table: StrategyTable, cards: readonly PlayingCardModel[]) {
  const groups = new Map<ExplanationInstruction, DealerValue[]>();
  for (const dealer of DEALERS) {
    const instruction = getSourceInstruction(table, cards, dealer);
    groups.set(instruction, [...(groups.get(instruction) ?? []), dealer]);
  }
  return groups;
}

function phrase(instruction: ExplanationInstruction, dealers: readonly DealerValue[], parentheticalFallback = false): string {
  const range = formatDealerSet(dealers);
  if (instruction === 'SURRENDER') return `Surrender ${range}`;
  if (instruction === 'SPLIT') return `Split ${range}`;
  if (instruction === 'SPLIT_IF_DAS') return `Split ${range} only with DAS`;
  if (instruction === 'DOUBLE_OR_HIT') return parentheticalFallback
    ? `Double ${range} if allowed (otherwise Hit)`
    : `Double ${range} if allowed; otherwise Hit`;
  if (instruction === 'DOUBLE_OR_STAND') return parentheticalFallback
    ? `Double ${range} if allowed (otherwise Stand)`
    : `Double ${range} if allowed; otherwise Stand`;
  if (instruction === 'STAND') return `Stand ${range}`;
  return `Hit ${range}`;
}

function createPatternExplanation(
  cards: readonly PlayingCardModel[],
  rules: BasicStrategyRules,
  patternLabel: string,
): string {
  const groups = groupInstructions(getTable(rules), cards);
  const hand = evaluateHand(cards);
  const pairRow = hand.isPair && hand.pairValue ? getTable(rules).pairs[hand.pairValue] : undefined;
  const neverSplit = pairRow ? DEALERS.every((dealer) => pairRow[dealer] === 'NO_SPLIT') : false;
  if (groups.size === 1) {
    const only = [...groups.keys()][0];
    if (only === 'STAND') return `${patternLabel}: Always Stand`;
    if (only === 'HIT') return `${patternLabel}: Always Hit`;
    if (only === 'SPLIT') return `${patternLabel}: Always Split`;
  }

  const order: ExplanationInstruction[] = [
    'SURRENDER',
    'SPLIT',
    'SPLIT_IF_DAS',
    'DOUBLE_OR_HIT',
    'DOUBLE_OR_STAND',
    'STAND',
    'HIT',
  ];
  const simpleGroups = (['HIT', 'STAND'] as const)
    .map((instruction) => ({ instruction, dealers: groups.get(instruction) ?? [] }))
    .filter((entry) => entry.dealers.length > 0);
  const defaultSimple = groups.has('HIT') ? 'HIT' : groups.has('STAND') ? 'STAND' : null;
  const nonDefaultInstructions = order.filter((instruction) => instruction !== defaultSimple && groups.has(instruction));
  const onlyRuleAlreadyContainsDefault = nonDefaultInstructions.length === 1
    && ((nonDefaultInstructions[0] === 'DOUBLE_OR_HIT' && defaultSimple === 'HIT')
      || (nonDefaultInstructions[0] === 'DOUBLE_OR_STAND' && defaultSimple === 'STAND'));

  const clauses = order.flatMap((instruction) => {
    const dealers = groups.get(instruction);
    if (!dealers?.length) return [];
    if (instruction === defaultSimple && !onlyRuleAlreadyContainsDefault) {
      return [`otherwise ${instruction === 'HIT' ? 'Hit' : 'Stand'}`];
    }
    if (instruction === defaultSimple) return [];
    const needsParentheticalFallback = (instruction === 'DOUBLE_OR_HIT' || instruction === 'DOUBLE_OR_STAND')
      && !onlyRuleAlreadyContainsDefault;
    return [phrase(instruction, dealers, needsParentheticalFallback)];
  });
  return `${patternLabel}: ${neverSplit ? 'Never Split; ' : ''}${clauses.join('; ')}`;
}

function getPatternLabel(cards: readonly PlayingCardModel[]): string {
  const hand = evaluateHand(cards);
  if (hand.isPair && hand.pairRank) {
    const name = hand.pairRank === 'A' ? 'Aces' : hand.pairValue === 10 ? '10s' : `${hand.pairRank}s`;
    return `Pair of ${name}`;
  }
  return `${hand.isSoft ? 'Soft' : 'Hard'} ${hand.total}`;
}

function createRuleCaveat(
  cards: readonly PlayingCardModel[],
  rules: BasicStrategyRules,
  availability: StrategyAvailability,
): string | null {
  const groups = groupInstructions(getTable(rules), cards);
  if (!availability.canSurrender && groups.has('SURRENDER')) {
    return 'Late surrender is unavailable; the correct play shown is the chart fallback.';
  }
  if (!availability.canSplit && (groups.has('SPLIT') || groups.has('SPLIT_IF_DAS'))) {
    return 'Splitting is unavailable; the correct play shown is the chart fallback.';
  }
  if (!availability.doubleAfterSplit && groups.has('SPLIT_IF_DAS')) {
    return 'DAS is unavailable; the correct play shown is the no-split fallback.';
  }
  if (!availability.canDouble && (groups.has('DOUBLE_OR_HIT') || groups.has('DOUBLE_OR_STAND'))) {
    return 'Doubling is unavailable; the correct play shown is the chart fallback.';
  }
  const otherRules = rules === 'H17' ? 'S17' : 'H17';
  const explanation = createPatternExplanation(cards, rules, getPatternLabel(cards));
  const otherExplanation = createPatternExplanation(cards, otherRules, getPatternLabel(cards));
  return explanation !== otherExplanation ? `${rules} chart pattern.` : null;
}

export function getBasicStrategyFeedback(
  playerHand: readonly PlayingCardModel[],
  dealerUpcard: PlayingCardModel,
  rules: BasicStrategyRules,
  availabilityOverrides: Partial<StrategyAvailability> = {},
): BasicStrategyDecisionFeedback {
  const availability = { ...DEFAULT_STRATEGY_AVAILABILITY, ...availabilityOverrides };
  const patternLabel = getPatternLabel(playerHand);
  return {
    handClassification: `${playerHand.map(formatCard).join(' + ')} = ${patternLabel}`,
    correctAction: getBasicStrategyAction(playerHand, dealerUpcard, rules, availability),
    patternLabel,
    patternExplanation: createPatternExplanation(playerHand, rules, patternLabel),
    activeRules: rules,
    ruleCaveat: createRuleCaveat(playerHand, rules, availability),
  };
}

export function getAnsweredStrategyFeedback(
  decision: BasicStrategyDecisionFeedback,
  answer: BasicStrategyDecisionFeedback['correctAction'],
) {
  return { ...decision, isCorrect: answer === decision.correctAction };
}
