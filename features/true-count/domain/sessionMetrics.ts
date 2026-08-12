import type { SessionMetrics } from '@/types/training';

import { classifyResponseSpeed } from './responseSpeed';

export const EMPTY_SESSION_METRICS: SessionMetrics = {
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

export function recordAnswer(
  metrics: SessionMetrics,
  isCorrect: boolean,
  responseTimeMs: number,
): SessionMetrics {
  const attempted = metrics.attempted + 1;
  const correct = metrics.correct + (isCorrect ? 1 : 0);
  const currentStreak = isCorrect ? metrics.currentStreak + 1 : 0;
  const totalResponseTimeMs = metrics.totalResponseTimeMs + Math.max(0, responseTimeMs);
  const automaticAnswers = metrics.automaticAnswers + (classifyResponseSpeed(responseTimeMs) === 'automatic' ? 1 : 0);

  return {
    attempted,
    correct,
    currentStreak,
    bestStreak: Math.max(metrics.bestStreak, currentStreak),
    totalResponseTimeMs,
    accuracyPercentage: (correct / attempted) * 100,
    averageResponseTimeMs: totalResponseTimeMs / attempted,
    automaticAnswers,
    automaticPercentage: (automaticAnswers / attempted) * 100,
  };
}
