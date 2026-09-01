import type { SessionMetrics } from '@/types/training';
import { classifyBasicStrategyResponseSpeed } from './responseSpeed';

export const EMPTY_BASIC_STRATEGY_METRICS: SessionMetrics = {
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

export function recordBasicStrategyAnswer(
  metrics: SessionMetrics,
  isCorrect: boolean,
  responseTimeMs: number,
): SessionMetrics {
  const attempted = metrics.attempted + 1;
  const correct = metrics.correct + Number(isCorrect);
  const currentStreak = isCorrect ? metrics.currentStreak + 1 : 0;
  const totalResponseTimeMs = metrics.totalResponseTimeMs + Math.max(0, responseTimeMs);
  const automaticAnswers = metrics.automaticAnswers
    + Number(classifyBasicStrategyResponseSpeed(responseTimeMs) === 'automatic');
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
