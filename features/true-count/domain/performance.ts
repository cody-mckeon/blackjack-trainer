import type {
  DeckPerformanceStats,
  DeckPerformanceSummary,
  TrueCountAnswerRecord,
} from '../types';

export function summarizeDeckPerformance(stats: DeckPerformanceStats): DeckPerformanceSummary {
  return {
    ...stats,
    accuracyPercentage: stats.attempted > 0 ? (stats.correct / stats.attempted) * 100 : 0,
    averageResponseTimeMs: stats.attempted > 0 ? stats.totalResponseTimeMs / stats.attempted : 0,
    automaticPercentage: stats.attempted > 0 ? (stats.automaticAnswers / stats.attempted) * 100 : 0,
  };
}

export function aggregateAnswerRecords(records: readonly TrueCountAnswerRecord[]): DeckPerformanceSummary[] {
  const byDeck = new Map<number, DeckPerformanceStats>();

  for (const record of records) {
    const current = byDeck.get(record.decksRemaining) ?? {
      decksRemaining: record.decksRemaining,
      attempted: 0,
      correct: 0,
      totalResponseTimeMs: 0,
      automaticAnswers: 0,
      lastPracticedAt: record.answeredAt,
      runningCounts: {},
    };

    byDeck.set(record.decksRemaining, {
      ...current,
      attempted: current.attempted + 1,
      correct: current.correct + (record.isCorrect ? 1 : 0),
      totalResponseTimeMs: current.totalResponseTimeMs + Math.max(0, record.responseTimeMs),
      automaticAnswers: current.automaticAnswers + (record.responseSpeed === 'automatic' ? 1 : 0),
      lastPracticedAt: record.answeredAt,
      runningCounts: current.runningCounts,
    });
  }

  return [...byDeck.values()].map(summarizeDeckPerformance).sort((a, b) => a.decksRemaining - b.decksRemaining);
}

export function updatePerformanceHistory(
  history: readonly DeckPerformanceStats[],
  record: TrueCountAnswerRecord,
): DeckPerformanceStats[] {
  const existing = history.find((entry) => entry.decksRemaining === record.decksRemaining);
  const existingRunningCounts = existing?.runningCounts ?? {};
  const runningCountKey = String(record.runningCount);
  const runningCountStats = existingRunningCounts[runningCountKey];
  const updated: DeckPerformanceStats = {
    decksRemaining: record.decksRemaining,
    attempted: (existing?.attempted ?? 0) + 1,
    correct: (existing?.correct ?? 0) + (record.isCorrect ? 1 : 0),
    totalResponseTimeMs: (existing?.totalResponseTimeMs ?? 0) + Math.max(0, record.responseTimeMs),
    automaticAnswers: (existing?.automaticAnswers ?? 0) + (record.responseSpeed === 'automatic' ? 1 : 0),
    lastPracticedAt: record.answeredAt,
    runningCounts: {
      ...existingRunningCounts,
      [runningCountKey]: {
        runningCount: record.runningCount,
        attempted: (runningCountStats?.attempted ?? 0) + 1,
        correct: (runningCountStats?.correct ?? 0) + (record.isCorrect ? 1 : 0),
        totalResponseTimeMs: (runningCountStats?.totalResponseTimeMs ?? 0) + Math.max(0, record.responseTimeMs),
        lastPracticedAt: record.answeredAt,
      },
    },
  };

  return [...history.filter((entry) => entry.decksRemaining !== record.decksRemaining), updated].sort(
    (a, b) => a.decksRemaining - b.decksRemaining,
  );
}

export function rankWeakestPatterns(
  performance: readonly DeckPerformanceSummary[],
  limit = 3,
): DeckPerformanceSummary[] {
  return [...performance]
    .sort((a, b) => {
      const accuracyDifference = a.accuracyPercentage - b.accuracyPercentage;
      return accuracyDifference !== 0 ? accuracyDifference : b.averageResponseTimeMs - a.averageResponseTimeMs;
    })
    .slice(0, limit);
}
