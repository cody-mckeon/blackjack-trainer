import type { TrueCountSettings } from './types';

export const DEFAULT_TRUE_COUNT_SETTINGS: TrueCountSettings = {
  shoeSize: 'mixed',
  runningCountMin: -20,
  runningCountMax: 20,
  deckPrecision: 0.5,
  sessionLength: 10,
};

export const RECENT_SESSION_LIMIT = 10;

export const RESPONSE_SPEED_THRESHOLDS_MS = {
  automatic: 1_500,
  fast: 3_000,
  calculating: 5_000,
} as const;

export const RESPONSE_SPEED_LABELS = {
  automatic: 'Automatic',
  fast: 'Fast',
  calculating: 'Calculating',
  'needs-practice': 'Needs practice',
} as const;

export const PATTERN_GUIDE_MAX_TRUE_COUNT = 4;
export const WEAK_PATTERN_LIMIT = 3;
