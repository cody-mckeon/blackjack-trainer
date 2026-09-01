import { RESPONSE_SPEED_LABELS, RESPONSE_SPEED_THRESHOLDS_MS } from '../constants';
import type { ResponseSpeed } from '../types';

export function classifyResponseSpeed(responseTimeMs: number): ResponseSpeed {
  const duration = Math.max(0, responseTimeMs);

  if (duration < RESPONSE_SPEED_THRESHOLDS_MS.automatic) return 'automatic';
  if (duration < RESPONSE_SPEED_THRESHOLDS_MS.fast) return 'fast';
  if (duration < RESPONSE_SPEED_THRESHOLDS_MS.calculating) return 'calculating';
  return 'needs-practice';
}

export function getResponseSpeedLabel(speed: ResponseSpeed): string {
  return RESPONSE_SPEED_LABELS[speed];
}
