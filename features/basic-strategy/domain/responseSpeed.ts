import type { ResponseSpeed } from '../types';

export const BASIC_STRATEGY_RESPONSE_SPEED_THRESHOLDS_MS = {
  automatic: 1500,
  fast: 3000,
  calculating: 5000,
} as const;

export function classifyBasicStrategyResponseSpeed(responseTimeMs: number): ResponseSpeed {
  const duration = Math.max(0, responseTimeMs);
  if (duration < BASIC_STRATEGY_RESPONSE_SPEED_THRESHOLDS_MS.automatic) return 'automatic';
  if (duration < BASIC_STRATEGY_RESPONSE_SPEED_THRESHOLDS_MS.fast) return 'fast';
  if (duration < BASIC_STRATEGY_RESPONSE_SPEED_THRESHOLDS_MS.calculating) return 'calculating';
  return 'needs-practice';
}

export const RESPONSE_SPEED_LABELS: Record<ResponseSpeed, string> = {
  automatic: 'Automatic',
  fast: 'Fast',
  calculating: 'Calculating',
  'needs-practice': 'Needs Practice',
};
