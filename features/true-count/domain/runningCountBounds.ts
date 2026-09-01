import { CARDS_PER_DECK, DEFAULT_SHOE_RUNNING_COUNT_BOUNDS, HI_LO_COUNT_CARDS_PER_DECK } from '../constants';
import type { ShoeSize } from '../types';

export interface ConfiguredRunningCountRange {
  minimum: number;
  maximum: number;
}

export interface RunningCountBounds extends ConfiguredRunningCountRange {
  theoreticalBound: number;
  exposureBound: number;
  remainingBound: number;
  physicalBound: number;
}

export function getTheoreticalRunningCountBound(startingDecks: ShoeSize): number {
  return HI_LO_COUNT_CARDS_PER_DECK * startingDecks;
}

export function getDefaultShoeRunningCountRange(startingDecks: ShoeSize): ConfiguredRunningCountRange {
  const bound = DEFAULT_SHOE_RUNNING_COUNT_BOUNDS[startingDecks];
  return { minimum: -bound, maximum: bound };
}

export function clampConfiguredRangeToTheoreticalBound(
  startingDecks: ShoeSize,
  configuredRange: ConfiguredRunningCountRange,
): ConfiguredRunningCountRange {
  const theoreticalBound = getTheoreticalRunningCountBound(startingDecks);
  return {
    minimum: Math.max(-theoreticalBound, Math.ceil(configuredRange.minimum)),
    maximum: Math.min(theoreticalBound, Math.floor(configuredRange.maximum)),
  };
}

export function getRunningCountBounds(
  startingDecks: ShoeSize,
  decksRemaining: number,
  configuredRange: ConfiguredRunningCountRange = getDefaultShoeRunningCountRange(startingDecks),
): RunningCountBounds {
  if (!Number.isFinite(decksRemaining) || decksRemaining < 0 || decksRemaining > startingDecks) {
    throw new Error('Decks remaining must be between zero and the starting shoe size.');
  }

  const theoreticalBound = getTheoreticalRunningCountBound(startingDecks);
  const decksPlayed = startingDecks - decksRemaining;
  const exposureBound = Math.floor(HI_LO_COUNT_CARDS_PER_DECK * decksPlayed + Number.EPSILON);
  // The unseen cards must be able to hold the opposite imbalance. Unlike the
  // early-shoe realism heuristic, this is a hard card-count feasibility limit.
  const remainingBound = Math.floor(CARDS_PER_DECK * decksRemaining + Number.EPSILON);
  const physicalBound = Math.min(theoreticalBound, exposureBound, remainingBound);
  const theoreticalRange = clampConfiguredRangeToTheoreticalBound(startingDecks, configuredRange);
  const rawMinimum = Math.max(theoreticalRange.minimum, -physicalBound);
  const minimum = Object.is(rawMinimum, -0) ? 0 : rawMinimum;
  const maximum = Math.min(theoreticalRange.maximum, physicalBound);

  // An asymmetric custom range can have no overlap early or late in a shoe.
  // Zero is the only universally valid fallback and avoids impossible questions.
  if (minimum > maximum) {
    return { minimum: 0, maximum: 0, theoreticalBound, exposureBound, remainingBound, physicalBound };
  }

  return { minimum, maximum, theoreticalBound, exposureBound, remainingBound, physicalBound };
}

export function isRunningCountPossible(
  runningCount: number,
  startingDecks: ShoeSize,
  decksRemaining: number,
): boolean {
  const bounds = getRunningCountBounds(startingDecks, decksRemaining, {
    minimum: -getTheoreticalRunningCountBound(startingDecks),
    maximum: getTheoreticalRunningCountBound(startingDecks),
  });
  return Number.isInteger(runningCount) && runningCount >= bounds.minimum && runningCount <= bounds.maximum;
}
