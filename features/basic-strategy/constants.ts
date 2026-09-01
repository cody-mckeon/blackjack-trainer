import type { BasicStrategyAction, BasicStrategySettings, HandCategory, HandPattern, TableRuleAssumptions } from './types';

export const DEFAULT_BASIC_STRATEGY_SETTINGS: BasicStrategySettings = {
  rules: 'H17',
  handTotalDisplay: 'after',
  cardSoundsEnabled: true,
  sessionLength: 25,
};

export const BASIC_STRATEGY_TABLE_RULES: TableRuleAssumptions = {
  doubleAfterSplit: true,
  lateSurrender: true,
};

export const DEALER_UPCARD_VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

export const ACTION_LABELS: Record<BasicStrategyAction, string> = {
  HIT: 'Hit',
  STAND: 'Stand',
  DOUBLE: 'Double',
  SPLIT: 'Split',
  SURRENDER: 'Surrender',
};

export const HAND_CATEGORY_LABELS: Record<HandCategory, string> = {
  hard: 'Hard Totals',
  soft: 'Soft Totals',
  pair: 'Pairs',
};

export const HARD_PATTERNS: HandPattern[] = Array.from({ length: 10 }, (_, index) => ({
  category: 'hard',
  value: index + 8,
  label: `Hard ${index + 8}`,
}));

export const SOFT_PATTERNS: HandPattern[] = Array.from({ length: 8 }, (_, index) => ({
  category: 'soft',
  value: index + 13,
  label: `Soft ${index + 13}`,
}));

const PAIR_LABELS = ['Aces', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s', '10s'] as const;
export const PAIR_PATTERNS: HandPattern[] = PAIR_LABELS.map((rank, index) => ({
  category: 'pair',
  value: index === 0 ? 11 : index + 1,
  label: `Pair of ${rank}`,
}));

export const ALL_HAND_PATTERNS = [...HARD_PATTERNS, ...SOFT_PATTERNS, ...PAIR_PATTERNS];
export const RECENT_BASIC_STRATEGY_SESSION_LIMIT = 20;
export const WEAKEST_HAND_LIMIT = 5;
