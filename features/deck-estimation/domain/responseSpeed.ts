import {
  DECK_ESTIMATION_RESPONSE_LABELS,
  DECK_ESTIMATION_RESPONSE_THRESHOLDS_MS,
} from '../constants';
import type { DeckEstimationResponseSpeed } from '../types';

export function classifyDeckEstimationResponseSpeed(responseTimeMs: number): DeckEstimationResponseSpeed {
  if (responseTimeMs < DECK_ESTIMATION_RESPONSE_THRESHOLDS_MS.automatic) return 'automatic';
  if (responseTimeMs < DECK_ESTIMATION_RESPONSE_THRESHOLDS_MS.fast) return 'fast';
  if (responseTimeMs < DECK_ESTIMATION_RESPONSE_THRESHOLDS_MS.calculating) return 'calculating';
  return 'needs-practice';
}

export function getDeckEstimationResponseSpeedLabel(speed: DeckEstimationResponseSpeed): string {
  return DECK_ESTIMATION_RESPONSE_LABELS[speed];
}
