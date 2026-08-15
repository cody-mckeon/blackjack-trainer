import { DEAL_SPEEDS_MS } from '../constants';
import type { RunningCountSessionSummary } from '../types';

export function createRunningCountRecommendation(summary: Omit<RunningCountSessionSummary, 'recommendation'>): string {
  if (summary.firstIncorrectCheckpoint) {
    return `Your count first diverged around card ${summary.firstIncorrectCheckpoint}. Practice shorter checkpoint intervals.`;
  }
  if (summary.mode === 'speed' && summary.finalCountCorrect && summary.dealIntervalMs) {
    const nextSpeed = DEAL_SPEEDS_MS.find((speed) => speed < summary.dealIntervalMs!);
    return nextSpeed
      ? `100% accurate at ${summary.dealIntervalMs} ms/card. Try ${nextSpeed} ms next.`
      : 'You are accurate at the fastest configured speed. Extend the shoe length.';
  }
  if (summary.errorTypes && Object.keys(summary.errorTypes).some((type) => type.includes('high'))) {
    return 'Focus on high-card recognition.';
  }
  if (summary.accuracyPercentage === 100 && summary.cardsPerSecond && summary.cardsPerSecond < 1) {
    return 'Accurate but slow. Try Cancellation Practice.';
  }
  if (summary.accuracyPercentage >= 90) return 'Your accuracy is strong. Work on maintaining the count over longer shoes.';
  return 'Slow down and use Checkpoint Practice to find where the count diverges.';
}
