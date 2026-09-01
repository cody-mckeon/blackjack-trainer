import type { RunningCountSettings } from './types';

export const DEAL_SPEEDS_MS = [1500, 1250, 1000, 750, 600, 500] as const;
export const AUTO_DEAL_INTERVALS_MS = [1500, 1000, 750, 500] as const;
export const CHECKPOINT_FREQUENCIES = [5, 10, 20, 'random'] as const;
export const ENDLESS_DURATIONS_SECONDS = [60, 120, 'endless'] as const;
export const CANCELLATION_QUESTIONS_PER_SESSION = 25;
export const RECENT_RUNNING_COUNT_SESSION_LIMIT = 30;
export const RECENT_VALID_TIME_LIMIT = 10;

export const DEFAULT_RUNNING_COUNT_SETTINGS: RunningCountSettings = {
  deckCount: 1,
  cardSoundsEnabled: true,
  countdownDealStyle: 'manual',
  autoDealIntervalMs: 1000,
  speedDealIntervalMs: 1000,
  checkpointFrequency: 10,
  cancellationChunkSize: 2,
  endlessDurationSeconds: 60,
};
