import { DEALER_UPCARD_VALUES } from '../constants';
import type { BasicStrategyRules, HandPattern } from '../types';
import { generateBasicStrategyQuestion } from './handGenerator';

export function createPatternRecallDealerOrder(random: () => number = Math.random): string[] {
  return [...DEALER_UPCARD_VALUES]
    .map((value) => ({ value, order: random() }))
    .sort((a, b) => a.order - b.order)
    .map(({ value }) => value);
}

export function generatePatternRecallQuestion(
  pattern: HandPattern,
  rules: BasicStrategyRules,
  dealerOrder: readonly string[],
  index: number,
  random: () => number = Math.random,
) {
  const dealerValue = dealerOrder[index % dealerOrder.length];
  return generateBasicStrategyQuestion({ rules, pattern, dealerValue, random });
}
