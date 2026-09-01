import { calculateDecksPlayed, calculateDiscardedCardCount, generateCalibrationValues } from './deckCalculations';
import { DECK_ESTIMATION_SHOE_SIZES } from '../types';
import type {
  DeckEstimateRange,
  DeckEstimationPrecision,
  DeckEstimationQuestion,
  DeckEstimationShoeSelection,
  DeckEstimationShoeSize,
  TrayVisualVariation,
} from '../types';

export interface DeckEstimationQuestionInput {
  startingDecks: DeckEstimationShoeSelection;
  precision: DeckEstimationPrecision;
  allowedRange?: DeckEstimateRange;
}

function choose<T>(values: readonly T[], random: () => number): T {
  return values[Math.min(values.length - 1, Math.floor(random() * values.length))];
}

export function createTrayVisualVariation(seed: number): TrayVisualVariation {
  const normalized = Math.abs(Math.trunc(seed));
  const sample = (salt: number) => ((normalized * (salt * 9301 + 49297) + 233280) % 1_000) / 1_000;

  return {
    seed: normalized,
    compression: 0.965 + sample(1) * 0.035,
    leanDegrees: -1.2 + sample(2) * 2.4,
    horizontalOffset: -2 + sample(3) * 4,
  };
}

export function getValidDeckEstimates(
  startingDecks: DeckEstimationShoeSize,
  precision: Exclude<DeckEstimationPrecision, 'mixed'>,
  allowedRange: DeckEstimateRange = {},
): number[] {
  const increment = precision === 'whole' ? 1 : precision === 'half' ? 0.5 : 0.25;
  return generateCalibrationValues(
    startingDecks,
    increment,
    allowedRange.minimum ?? 1,
    allowedRange.maximum ?? startingDecks,
  );
}

function createAnswerChoices(
  correctAnswer: number,
  startingDecks: DeckEstimationShoeSize,
  precision: Exclude<DeckEstimationPrecision, 'mixed'>,
): number[] {
  const allValues = getValidDeckEstimates(startingDecks, precision).sort((a, b) => a - b);
  const correctIndex = allValues.indexOf(correctAnswer);
  const maximumChoices = 6;
  let start = Math.max(0, correctIndex - Math.floor(maximumChoices / 2));
  start = Math.min(start, Math.max(0, allValues.length - maximumChoices));
  return allValues.slice(start, start + maximumChoices);
}

export function generateDeckEstimationQuestion(
  input: DeckEstimationQuestionInput,
  random: () => number = Math.random,
  now: () => number = Date.now,
): DeckEstimationQuestion {
  const startingDecks =
    input.startingDecks === 'mixed' ? choose(DECK_ESTIMATION_SHOE_SIZES, random) : input.startingDecks;
  const precision = input.precision === 'mixed' ? (random() < 0.5 ? 'whole' : 'half') : input.precision;
  const values = getValidDeckEstimates(startingDecks, precision, input.allowedRange);

  if (values.length === 0) throw new Error('The allowed range does not contain a valid deck estimate.');

  const decksRemaining = choose(values, random);
  const decksPlayed = calculateDecksPlayed(startingDecks, decksRemaining);
  const discardedCardCount = calculateDiscardedCardCount(startingDecks, decksRemaining);
  const timestamp = now();
  const visualSeed = Math.floor(random() * 1_000_000) + timestamp;

  return {
    id: `${timestamp}-${startingDecks}-${decksRemaining}-${visualSeed}`,
    startingDecks,
    precision,
    decksRemaining,
    decksPlayed,
    discardedCardCount,
    answerChoices: createAnswerChoices(decksRemaining, startingDecks, precision),
    visualVariation: createTrayVisualVariation(visualSeed),
  };
}
