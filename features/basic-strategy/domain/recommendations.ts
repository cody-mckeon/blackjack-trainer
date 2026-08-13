import type { BasicStrategyPerformanceSummary, CategoryPerformanceSummary } from '../types';

export function createBasicStrategyRecommendations(
  categories: readonly CategoryPerformanceSummary[],
  weakestHands: readonly BasicStrategyPerformanceSummary[],
): string[] {
  if (weakestHands.length === 0) return ['Build a baseline with another mixed practice session.'];
  const recommendations = [`Practice ${weakestHands[0].patternLabel}.`];
  const strongest = [...categories].sort((a, b) => b.accuracyPercentage - a.accuracyPercentage)[0];
  const weakest = [...categories].sort((a, b) => a.accuracyPercentage - b.accuracyPercentage)[0];
  if (strongest && weakest && strongest.category !== weakest.category) {
    recommendations.push(`Your ${strongest.category} strategy is strongest. Focus on ${weakest.category} totals.`);
  }
  return recommendations.slice(0, 2);
}
