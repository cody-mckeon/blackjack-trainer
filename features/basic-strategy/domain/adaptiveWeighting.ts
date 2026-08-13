import type { BasicStrategyPerformanceStats, BasicStrategyRules, HandPattern } from '../types';
import { DEALER_UPCARD_VALUES } from '../constants';

export interface AdaptivePatternWeight {
  pattern: HandPattern;
  weight: number;
}

export interface AdaptiveDealerWeight {
  dealerValue: string;
  weight: number;
}

function calculateWeight(matches: readonly BasicStrategyPerformanceStats[], nowMs: number): number {
  if (matches.length === 0) return 6;
  const attempted = matches.reduce((sum, entry) => sum + entry.attempted, 0);
  const correct = matches.reduce((sum, entry) => sum + entry.correct, 0);
  const averageTime = matches.reduce((sum, entry) => sum + entry.totalResponseTimeMs, 0) / attempted;
  const lastPracticed = Math.max(...matches.map((entry) => Date.parse(entry.lastPracticedAt) || 0));
  const daysOverdue = Math.max(0, (nowMs - lastPracticed) / 86_400_000);
  const accuracyPenalty = (1 - correct / attempted) * 8;
  const speedPenalty = Math.min(5, Math.max(0, (averageTime - 1500) / 1000));
  const recencyPenalty = Math.min(4, daysOverdue / 7);
  const masteryReduction = correct / attempted >= 0.95 && averageTime < 2000 && attempted >= 5 ? 0.5 : 1;
  return Math.max(0.5, (1 + accuracyPenalty + speedPenalty + recencyPenalty) * masteryReduction);
}

export function calculateAdaptivePatternWeights(
  patterns: readonly HandPattern[],
  rules: BasicStrategyRules,
  history: readonly BasicStrategyPerformanceStats[],
  nowMs = Date.now(),
): AdaptivePatternWeight[] {
  return patterns.map((pattern) => {
    const matches = history.filter((entry) => entry.rules === rules && entry.patternLabel === pattern.label);
    return { pattern, weight: calculateWeight(matches, nowMs) };
  });
}

export function chooseAdaptivePattern(weights: readonly AdaptivePatternWeight[], random: () => number = Math.random): HandPattern {
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;
  for (const entry of weights) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.pattern;
  }
  return weights[weights.length - 1].pattern;
}

export function calculateAdaptiveDealerWeights(
  pattern: HandPattern,
  rules: BasicStrategyRules,
  history: readonly BasicStrategyPerformanceStats[],
  nowMs = Date.now(),
): AdaptiveDealerWeight[] {
  return DEALER_UPCARD_VALUES.map((dealerValue) => ({
    dealerValue,
    weight: calculateWeight(
      history.filter((entry) => entry.rules === rules && entry.patternLabel === pattern.label && entry.dealerUpcardValue === dealerValue),
      nowMs,
    ),
  }));
}

export function chooseAdaptiveDealerValue(weights: readonly AdaptiveDealerWeight[], random: () => number = Math.random): string {
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;
  for (const entry of weights) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.dealerValue;
  }
  return weights[weights.length - 1].dealerValue;
}
