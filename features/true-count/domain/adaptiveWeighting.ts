import { getValidDecksRemaining, type RandomSource } from './questionGenerator';
import { summarizeDeckPerformance } from './performance';
import { SHOE_SIZES, type DeckPerformanceStats, type TrueCountSettings } from '../types';

export interface WeightedDeckValue {
  decksRemaining: number;
  weight: number;
}

export interface WeightedRunningCount {
  runningCount: number;
  weight: number;
}

function getEligibleDeckValues(settings: TrueCountSettings): number[] {
  const shoeSizes = settings.shoeSize === 'mixed' ? SHOE_SIZES : [settings.shoeSize];
  return [...new Set(shoeSizes.flatMap((shoeSize) => getValidDecksRemaining(shoeSize, settings.deckPrecision)))].sort(
    (a, b) => b - a,
  );
}

export function calculateAdaptiveWeights(
  settings: TrueCountSettings,
  history: readonly DeckPerformanceStats[],
  nowMs = Date.now(),
): WeightedDeckValue[] {
  const practiced = history.filter((entry) => entry.attempted > 0);
  const overallAverageMs =
    practiced.reduce((total, entry) => total + entry.totalResponseTimeMs, 0) /
      Math.max(1, practiced.reduce((total, entry) => total + entry.attempted, 0)) || 3_000;

  return getEligibleDeckValues(settings).map((decksRemaining) => {
    const stats = history.find((entry) => entry.decksRemaining === decksRemaining);
    if (!stats || stats.attempted === 0) return { decksRemaining, weight: 6 };

    const summary = summarizeDeckPerformance(stats);
    const accuracyPenalty = (1 - summary.accuracyPercentage / 100) * 5;
    const speedPenalty = Math.max(0, Math.min(3, summary.averageResponseTimeMs / overallAverageMs - 1));
    const daysSincePractice = Math.max(0, (nowMs - Date.parse(stats.lastPracticedAt)) / 86_400_000);
    const recencyPenalty = Math.min(2, daysSincePractice / 7);
    const masteryDiscount = summary.accuracyPercentage >= 90 && summary.averageResponseTimeMs < overallAverageMs ? 0.5 : 1;
    const weight = Math.max(0.5, (1 + accuracyPenalty + speedPenalty + recencyPenalty) * masteryDiscount);

    return { decksRemaining, weight: Number(weight.toFixed(3)) };
  });
}

export function chooseWeightedDeckValue(
  weightedValues: readonly WeightedDeckValue[],
  random: RandomSource = Math.random,
): number {
  if (weightedValues.length === 0) throw new Error('At least one weighted deck value is required.');

  const totalWeight = weightedValues.reduce((total, entry) => total + entry.weight, 0);
  let threshold = random() * totalWeight;

  for (const entry of weightedValues) {
    threshold -= entry.weight;
    if (threshold < 0) return entry.decksRemaining;
  }

  return weightedValues[weightedValues.length - 1].decksRemaining;
}

export function calculateAdaptiveRunningCountWeights(
  settings: TrueCountSettings,
  decksRemaining: number,
  history: readonly DeckPerformanceStats[],
  nowMs = Date.now(),
): WeightedRunningCount[] {
  const deckHistory = history.find((entry) => entry.decksRemaining === decksRemaining);
  const practiced = Object.values(deckHistory?.runningCounts ?? {});
  const averageMs =
    practiced.reduce((total, entry) => total + entry.totalResponseTimeMs, 0) /
      Math.max(1, practiced.reduce((total, entry) => total + entry.attempted, 0)) || 3_000;

  return Array.from(
    { length: settings.runningCountMax - settings.runningCountMin + 1 },
    (_, index) => settings.runningCountMin + index,
  ).map((runningCount) => {
    const stats = deckHistory?.runningCounts?.[String(runningCount)];
    if (!stats || stats.attempted === 0) return { runningCount, weight: 4 };

    const accuracy = stats.correct / stats.attempted;
    const responseTimeMs = stats.totalResponseTimeMs / stats.attempted;
    const daysSincePractice = Math.max(0, (nowMs - Date.parse(stats.lastPracticedAt)) / 86_400_000);
    const weight = Math.max(
      0.5,
      1 + (1 - accuracy) * 4 + Math.max(0, Math.min(2, responseTimeMs / averageMs - 1)) + Math.min(1.5, daysSincePractice / 7),
    );

    return { runningCount, weight: Number(weight.toFixed(3)) };
  });
}

export function chooseWeightedRunningCount(
  weightedValues: readonly WeightedRunningCount[],
  random: RandomSource = Math.random,
): number {
  return chooseWeightedDeckValue(
    weightedValues.map((entry) => ({ decksRemaining: entry.runningCount, weight: entry.weight })),
    random,
  );
}
