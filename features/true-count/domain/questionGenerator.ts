import { calculateTrueCount } from './trueCount';
import { SHOE_SIZES, type ShoeSize, type TrueCountQuestion, type TrueCountSettings } from '../types';

export type RandomSource = () => number;

export interface QuestionGenerationOptions {
  fixedDecksRemaining?: number;
  fixedRunningCount?: number;
}

export function getValidDecksRemaining(shoeSize: ShoeSize, precision = 0.5): number[] {
  if (precision <= 0 || precision > 1) {
    throw new Error('Deck precision must be greater than zero and no more than one deck.');
  }

  const values: number[] = [];
  const steps = Math.floor((shoeSize - 1) / precision);

  for (let index = 0; index <= steps; index += 1) {
    values.push(Number((shoeSize - index * precision).toFixed(2)));
  }

  if (values.at(-1) !== 1) {
    values.push(1);
  }

  return values;
}

function choose<T>(values: readonly T[], random: RandomSource): T {
  return values[Math.floor(random() * values.length)];
}

function randomInteger(min: number, max: number, random: RandomSource): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle<T>(values: T[], random: RandomSource): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function createAnswerChoices(correctAnswer: number, random: RandomSource = Math.random): number[] {
  return shuffle(
    [correctAnswer - 2, correctAnswer - 1, correctAnswer, correctAnswer + 1, correctAnswer + 2],
    random,
  );
}

export function generateTrueCountQuestion(
  settings: TrueCountSettings,
  random: RandomSource = Math.random,
  now: () => number = Date.now,
  options: QuestionGenerationOptions = {},
): TrueCountQuestion {
  const shoeSize =
    options.fixedDecksRemaining === undefined
      ? settings.shoeSize === 'mixed'
        ? choose(SHOE_SIZES, random)
        : settings.shoeSize
      : settings.shoeSize === 'mixed'
        ? (SHOE_SIZES.find((size) => size >= options.fixedDecksRemaining!) ?? 8)
        : settings.shoeSize;
  const decksRemaining =
    options.fixedDecksRemaining ?? choose(getValidDecksRemaining(shoeSize, settings.deckPrecision), random);

  if (decksRemaining > shoeSize || decksRemaining < 1) {
    throw new Error('Fixed decks remaining must fit within the selected shoe.');
  }
  const runningCount =
    options.fixedRunningCount ?? randomInteger(settings.runningCountMin, settings.runningCountMax, random);

  if (runningCount < settings.runningCountMin || runningCount > settings.runningCountMax || !Number.isInteger(runningCount)) {
    throw new Error('Fixed running count must be a whole number within the configured range.');
  }
  const correctAnswer = calculateTrueCount(runningCount, decksRemaining);

  return {
    id: `${now()}-${Math.floor(random() * 1_000_000)}`,
    shoeSize,
    runningCount,
    decksRemaining,
    correctAnswer,
    answerChoices: createAnswerChoices(correctAnswer, random),
  };
}
