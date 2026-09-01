import type { DeckEstimationSettings } from './types';

export const CARDS_PER_DECK = 52;

export const DEFAULT_DECK_ESTIMATION_SETTINGS: DeckEstimationSettings = {
  shoeSize: 6,
  precision: 'half',
  sessionLength: 10,
};

export const DECK_ESTIMATION_RESPONSE_THRESHOLDS_MS = {
  automatic: 1_500,
  fast: 3_000,
  calculating: 5_000,
} as const;

export const DECK_ESTIMATION_RESPONSE_LABELS = {
  automatic: 'Automatic',
  fast: 'Fast',
  calculating: 'Calculating',
  'needs-practice': 'Needs practice',
} as const;

export const RECENT_DECK_ESTIMATION_SESSION_LIMIT = 10;
export const WEAKEST_ESTIMATE_LIMIT = 3;
export const CONFUSION_PAIR_LIMIT = 3;
