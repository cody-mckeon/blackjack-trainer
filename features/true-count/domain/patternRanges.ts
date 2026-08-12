import { PATTERN_GUIDE_MAX_TRUE_COUNT } from '../constants';
import { calculateTrueCount, formatSignedCount } from './trueCount';

export interface PatternRange {
  trueCount: number;
  minimumRunningCount: number;
  maximumRunningCount: number;
}

export function generatePatternRanges(
  decksRemaining: number,
  maxTrueCount = PATTERN_GUIDE_MAX_TRUE_COUNT,
): PatternRange[] {
  if (decksRemaining <= 0 || maxTrueCount < 1 || !Number.isInteger(maxTrueCount)) {
    throw new Error('Pattern ranges require positive decks remaining and a positive whole true-count limit.');
  }

  const runningCountLimit = Math.ceil(decksRemaining * (maxTrueCount + 1));
  const ranges: PatternRange[] = [];

  for (const trueCount of [
    ...Array.from({ length: maxTrueCount }, (_, index) => index + 1),
    ...Array.from({ length: maxTrueCount }, (_, index) => -(index + 1)),
  ]) {
    const matches: number[] = [];

    for (let runningCount = -runningCountLimit; runningCount <= runningCountLimit; runningCount += 1) {
      if (calculateTrueCount(runningCount, decksRemaining) === trueCount) {
        matches.push(runningCount);
      }
    }

    if (matches.length > 0) {
      ranges.push({
        trueCount,
        minimumRunningCount: matches[0],
        maximumRunningCount: matches[matches.length - 1],
      });
    }
  }

  return ranges;
}

export function getPatternRangeForRunningCount(
  runningCount: number,
  decksRemaining: number,
): PatternRange | null {
  const trueCount = calculateTrueCount(runningCount, decksRemaining);
  if (trueCount === 0) return null;

  const limit = Math.max(PATTERN_GUIDE_MAX_TRUE_COUNT, Math.abs(trueCount) + 1);
  return generatePatternRanges(decksRemaining, limit).find((range) => range.trueCount === trueCount) ?? null;
}

export function formatPatternRange(range: PatternRange): string {
  const runningCount =
    range.minimumRunningCount === range.maximumRunningCount
      ? `RC ${formatSignedCount(range.minimumRunningCount)}`
      : `RC ${formatSignedCount(range.minimumRunningCount)} to ${formatSignedCount(range.maximumRunningCount)}`;

  return `${runningCount} → TC ${formatSignedCount(range.trueCount)}`;
}

export function createPatternCue(runningCount: number, decksRemaining: number): string | null {
  const range = getPatternRangeForRunningCount(runningCount, decksRemaining);
  if (!range) return null;

  const nextTrueCount = range.trueCount > 0 ? range.trueCount + 1 : range.trueCount - 1;
  const nextRange = generatePatternRanges(decksRemaining, Math.abs(nextTrueCount)).find(
    (candidate) => candidate.trueCount === nextTrueCount,
  );
  const boundary = nextRange
    ? nextTrueCount > 0
      ? formatSignedCount(nextRange.minimumRunningCount)
      : formatSignedCount(nextRange.maximumRunningCount)
    : null;

  const base = `At ${decksRemaining} decks, ${formatPatternRange(range).replace(' → ', ' maps to ')}.`;
  return boundary ? `${base} ${boundary} begins TC ${formatSignedCount(nextTrueCount)}.` : base;
}
