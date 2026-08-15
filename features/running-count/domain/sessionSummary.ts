import { createRunningCountRecommendation } from './recommendations';
import type { RunningCountSessionSummary } from '../types';

type SummaryInput = Omit<RunningCountSessionSummary, 'id' | 'completedAt' | 'recommendation'>;

export function createRunningCountSessionSummary(input: SummaryInput): RunningCountSessionSummary {
  const completedAt = new Date().toISOString();
  const base = { ...input, id: `${Date.now()}-${input.mode}`, completedAt };
  return { ...base, recommendation: createRunningCountRecommendation(base) };
}
