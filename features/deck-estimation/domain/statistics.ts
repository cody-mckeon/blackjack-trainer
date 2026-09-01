import { classifyDeckEstimationResponseSpeed } from './responseSpeed';
import type { SessionMetrics } from '@/types/training';
import type {
  ConfusionPair,
  DeckEstimateHistoryEntry,
  DeckEstimatePerformance,
  DeckEstimationAnswerRecord,
} from '../types';

export const EMPTY_DECK_ESTIMATION_METRICS: SessionMetrics = {
  attempted: 0,
  correct: 0,
  accuracyPercentage: 0,
  currentStreak: 0,
  bestStreak: 0,
  averageResponseTimeMs: 0,
  totalResponseTimeMs: 0,
  automaticAnswers: 0,
  automaticPercentage: 0,
};

export function recordDeckEstimationAnswer(
  metrics: SessionMetrics,
  isCorrect: boolean,
  responseTimeMs: number,
): SessionMetrics {
  const attempted = metrics.attempted + 1;
  const correct = metrics.correct + (isCorrect ? 1 : 0);
  const currentStreak = isCorrect ? metrics.currentStreak + 1 : 0;
  const totalResponseTimeMs = metrics.totalResponseTimeMs + Math.max(0, responseTimeMs);
  const automaticAnswers =
    metrics.automaticAnswers +
    (classifyDeckEstimationResponseSpeed(responseTimeMs) === 'automatic' ? 1 : 0);

  return {
    attempted,
    correct,
    currentStreak,
    bestStreak: Math.max(metrics.bestStreak, currentStreak),
    totalResponseTimeMs,
    averageResponseTimeMs: totalResponseTimeMs / attempted,
    accuracyPercentage: (correct / attempted) * 100,
    automaticAnswers,
    automaticPercentage: (automaticAnswers / attempted) * 100,
  };
}

export function aggregateDeckEstimatePerformance(
  answers: readonly DeckEstimationAnswerRecord[],
): DeckEstimatePerformance[] {
  const grouped = new Map<number, DeckEstimationAnswerRecord[]>();
  answers.forEach((answer) => grouped.set(answer.correctAnswer, [...(grouped.get(answer.correctAnswer) ?? []), answer]));

  return [...grouped.entries()]
    .map(([decksRemaining, records]) => {
      const attempted = records.length;
      const correct = records.filter((record) => record.isCorrect).length;
      const totalResponseTimeMs = records.reduce((total, record) => total + record.responseTimeMs, 0);
      const automaticAnswers = records.filter((record) => record.responseSpeed === 'automatic').length;
      const wrongCounts = new Map<number, number>();
      records.filter((record) => !record.isCorrect).forEach((record) => {
        wrongCounts.set(record.answer, (wrongCounts.get(record.answer) ?? 0) + 1);
      });
      const mostCommonWrongAnswer = [...wrongCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

      return {
        decksRemaining,
        attempted,
        correct,
        totalResponseTimeMs,
        automaticAnswers,
        accuracyPercentage: (correct / attempted) * 100,
        averageResponseTimeMs: totalResponseTimeMs / attempted,
        automaticPercentage: (automaticAnswers / attempted) * 100,
        mostCommonWrongAnswer,
      };
    })
    .sort((a, b) => b.decksRemaining - a.decksRemaining);
}

export function rankWeakestDeckEstimates(
  performance: readonly DeckEstimatePerformance[],
  limit = 3,
): DeckEstimatePerformance[] {
  return [...performance]
    .sort((a, b) => a.accuracyPercentage - b.accuracyPercentage || b.averageResponseTimeMs - a.averageResponseTimeMs)
    .slice(0, limit);
}

export function findMostCommonConfusions(
  answers: readonly DeckEstimationAnswerRecord[],
  limit = 3,
): ConfusionPair[] {
  const counts = new Map<string, ConfusionPair>();
  answers.filter((answer) => !answer.isCorrect).forEach((answer) => {
    const key = `${answer.correctAnswer}:${answer.answer}`;
    const current = counts.get(key);
    counts.set(key, {
      expected: answer.correctAnswer,
      answered: answer.answer,
      count: (current?.count ?? 0) + 1,
    });
  });
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export function updateDeckEstimateHistory(
  history: readonly DeckEstimateHistoryEntry[],
  answer: DeckEstimationAnswerRecord,
): DeckEstimateHistoryEntry[] {
  const current = history.find((entry) => entry.decksRemaining === answer.correctAnswer);
  const confusions = { ...(current?.confusions ?? {}) };
  if (!answer.isCorrect) confusions[String(answer.answer)] = (confusions[String(answer.answer)] ?? 0) + 1;
  const next: DeckEstimateHistoryEntry = {
    decksRemaining: answer.correctAnswer,
    attempted: (current?.attempted ?? 0) + 1,
    correct: (current?.correct ?? 0) + (answer.isCorrect ? 1 : 0),
    totalResponseTimeMs: (current?.totalResponseTimeMs ?? 0) + answer.responseTimeMs,
    automaticAnswers: (current?.automaticAnswers ?? 0) + (answer.responseSpeed === 'automatic' ? 1 : 0),
    confusions,
    lastPracticedAt: answer.answeredAt,
  };
  return [...history.filter((entry) => entry.decksRemaining !== answer.correctAnswer), next].sort(
    (a, b) => b.decksRemaining - a.decksRemaining,
  );
}
