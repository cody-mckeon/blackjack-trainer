import type { DeckPerformanceSummary } from '../types';

export function createSessionRecommendation(performance: readonly DeckPerformanceSummary[]): string {
  if (performance.length === 0) return 'Complete a few questions to reveal your strongest patterns.';

  const weakest = [...performance].sort((a, b) => {
    const accuracyDifference = a.accuracyPercentage - b.accuracyPercentage;
    return accuracyDifference !== 0 ? accuracyDifference : b.averageResponseTimeMs - a.averageResponseTimeMs;
  })[0];

  if (weakest.accuracyPercentage < 85) {
    return `Practice ${weakest.decksRemaining} decks remaining in Pattern Recall.`;
  }

  if (weakest.averageResponseTimeMs >= 3_000) {
    return `Your accuracy is strong. Get ${weakest.decksRemaining}-deck conversions under 3 seconds.`;
  }

  const mostAutomatic = [...performance].sort((a, b) => b.automaticPercentage - a.automaticPercentage)[0];
  return `You are already automatic at ${mostAutomatic.decksRemaining} decks remaining.`;
}
