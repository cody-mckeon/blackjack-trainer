import type {
  BasicStrategyAnswerRecord,
  BasicStrategyPerformanceStats,
  BasicStrategyPerformanceSummary,
  CategoryPerformanceSummary,
  HandCategory,
} from '../types';

export function createPerformanceKey(record: Pick<BasicStrategyAnswerRecord, 'rules' | 'patternLabel' | 'dealerUpcardValue'>) {
  return `${record.rules}|${record.patternLabel}|${record.dealerUpcardValue}`;
}

export function summarizePerformance(stats: BasicStrategyPerformanceStats): BasicStrategyPerformanceSummary {
  return {
    ...stats,
    accuracyPercentage: stats.attempted ? (stats.correct / stats.attempted) * 100 : 0,
    averageResponseTimeMs: stats.attempted ? stats.totalResponseTimeMs / stats.attempted : 0,
    automaticPercentage: stats.attempted ? (stats.automaticAnswers / stats.attempted) * 100 : 0,
  };
}

export function updateBasicStrategyPerformance(
  history: readonly BasicStrategyPerformanceStats[],
  record: BasicStrategyAnswerRecord,
): BasicStrategyPerformanceStats[] {
  const key = createPerformanceKey(record);
  const existing = history.find((entry) => entry.key === key);
  const updated: BasicStrategyPerformanceStats = {
    key,
    rules: record.rules,
    category: record.category,
    patternLabel: record.patternLabel,
    dealerUpcardValue: record.dealerUpcardValue,
    attempted: (existing?.attempted ?? 0) + 1,
    correct: (existing?.correct ?? 0) + Number(record.isCorrect),
    totalResponseTimeMs: (existing?.totalResponseTimeMs ?? 0) + Math.max(0, record.responseTimeMs),
    automaticAnswers: (existing?.automaticAnswers ?? 0) + Number(record.responseSpeed === 'automatic'),
    lastPracticedAt: record.answeredAt,
  };
  return [...history.filter((entry) => entry.key !== key), updated].sort((a, b) => a.key.localeCompare(b.key));
}

export function aggregateBasicStrategyRecords(
  records: readonly BasicStrategyAnswerRecord[],
): BasicStrategyPerformanceSummary[] {
  let history: BasicStrategyPerformanceStats[] = [];
  for (const record of records) history = updateBasicStrategyPerformance(history, record);
  return history.map(summarizePerformance);
}

export function aggregateCategoryPerformance(
  records: readonly BasicStrategyAnswerRecord[],
): CategoryPerformanceSummary[] {
  const categories: HandCategory[] = ['hard', 'soft', 'pair'];
  return categories
    .map((category) => {
      const matches = records.filter((record) => record.category === category);
      const attempted = matches.length;
      const correct = matches.filter((record) => record.isCorrect).length;
      const totalTime = matches.reduce((sum, record) => sum + record.responseTimeMs, 0);
      return {
        category,
        attempted,
        correct,
        accuracyPercentage: attempted ? (correct / attempted) * 100 : 0,
        averageResponseTimeMs: attempted ? totalTime / attempted : 0,
      };
    })
    .filter((summary) => summary.attempted > 0);
}

export function rankWeakestHands(
  performance: readonly BasicStrategyPerformanceSummary[],
  limit = 5,
): BasicStrategyPerformanceSummary[] {
  return [...performance]
    .sort((a, b) =>
      a.accuracyPercentage - b.accuracyPercentage
      || b.averageResponseTimeMs - a.averageResponseTimeMs
      || a.lastPracticedAt.localeCompare(b.lastPracticedAt),
    )
    .slice(0, limit);
}

export function rankWeakestDealerUpcards(
  performance: readonly BasicStrategyPerformanceSummary[],
  limit = 5,
): BasicStrategyPerformanceSummary[] {
  const grouped = new Map<string, BasicStrategyPerformanceStats>();
  for (const entry of performance) {
    const key = `${entry.rules}|${entry.dealerUpcardValue}`;
    const current = grouped.get(key) ?? { ...entry, key, patternLabel: `Dealer ${entry.dealerUpcardValue}`, attempted: 0, correct: 0, totalResponseTimeMs: 0, automaticAnswers: 0 };
    grouped.set(key, {
      ...current,
      attempted: current.attempted + entry.attempted,
      correct: current.correct + entry.correct,
      totalResponseTimeMs: current.totalResponseTimeMs + entry.totalResponseTimeMs,
      automaticAnswers: current.automaticAnswers + entry.automaticAnswers,
      lastPracticedAt: current.lastPracticedAt > entry.lastPracticedAt ? current.lastPracticedAt : entry.lastPracticedAt,
    });
  }
  return rankWeakestHands([...grouped.values()].map(summarizePerformance), limit);
}
