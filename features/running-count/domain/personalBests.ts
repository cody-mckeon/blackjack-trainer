import { RECENT_VALID_TIME_LIMIT } from '../constants';
import type { RunningCountPersonalBest, RunningCountSessionSummary } from '../types';

export function getPersonalBestKey(summary: Pick<RunningCountSessionSummary, 'mode' | 'deckCount'>): string {
  return `${summary.mode}:${summary.deckCount}`;
}

export function isSuccessfulSession(summary: RunningCountSessionSummary): boolean {
  if (summary.mode === 'hidden-card') return summary.finalCountCorrect === true && summary.hiddenCategoryCorrect === true;
  if (summary.mode === 'countdown' || summary.mode === 'speed') return summary.finalCountCorrect === true;
  return summary.accuracyPercentage === 100;
}

export function updatePersonalBest(
  current: RunningCountPersonalBest | undefined,
  summary: RunningCountSessionSummary,
): RunningCountPersonalBest {
  const successful = isSuccessfulSession(summary);
  const timedSuccess = successful && (summary.mode === 'countdown' || summary.mode === 'hidden-card');
  const recentValidTimesMs = timedSuccess
    ? [summary.elapsedTimeMs, ...(current?.recentValidTimesMs ?? [])].slice(0, RECENT_VALID_TIME_LIMIT)
    : current?.recentValidTimesMs ?? [];
  const bestValidTimeMs = timedSuccess
    ? Math.min(summary.elapsedTimeMs, current?.bestValidTimeMs ?? Number.POSITIVE_INFINITY)
    : current?.bestValidTimeMs;
  const fastestSuccessfulDealMs = summary.mode === 'speed' && successful && summary.dealIntervalMs
    ? Math.min(summary.dealIntervalMs, current?.fastestSuccessfulDealMs ?? Number.POSITIVE_INFINITY)
    : current?.fastestSuccessfulDealMs;
  const currentStreak = successful ? (current?.currentStreak ?? 0) + 1 : 0;

  return {
    key: getPersonalBestKey(summary),
    mode: summary.mode,
    deckCount: summary.deckCount,
    bestValidTimeMs,
    recentValidTimesMs,
    averageValidTimeMs: recentValidTimesMs.length
      ? recentValidTimesMs.reduce((total, time) => total + time, 0) / recentValidTimesMs.length
      : undefined,
    fastestSuccessfulDealMs,
    currentStreak,
    bestStreak: Math.max(current?.bestStreak ?? 0, currentStreak, summary.longestCorrectStreak ?? 0),
    attempts: (current?.attempts ?? 0) + 1,
    successfulAttempts: (current?.successfulAttempts ?? 0) + (successful ? 1 : 0),
  };
}

export function updatePersonalBestCollection(
  records: readonly RunningCountPersonalBest[],
  summary: RunningCountSessionSummary,
): RunningCountPersonalBest[] {
  const key = getPersonalBestKey(summary);
  const updated = updatePersonalBest(records.find((record) => record.key === key), summary);
  return [updated, ...records.filter((record) => record.key !== key)];
}
