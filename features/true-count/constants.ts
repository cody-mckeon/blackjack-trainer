import type { TrueCountSettings } from './types';

export const DEFAULT_TRUE_COUNT_SETTINGS: TrueCountSettings = {
  shoeSize: 'mixed',
  runningCountMin: -20,
  runningCountMax: 20,
  deckPrecision: 0.5,
  sessionLength: 10,
};

export const RECENT_SESSION_LIMIT = 10;
