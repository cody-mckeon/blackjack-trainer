import { DEFAULT_TRUE_COUNT_SETTINGS } from '../../constants';
import { SHOE_SIZES } from '../../types';
import { generateTrueCountQuestion } from '../questionGenerator';
import {
  clampConfiguredRangeToTheoreticalBound,
  getDefaultShoeRunningCountRange,
  getRunningCountBounds,
  getTheoreticalRunningCountBound,
  isRunningCountPossible,
} from '../runningCountBounds';

describe('realistic running count bounds', () => {
  it.each([
    [1, -15, 15, 20],
    [2, -20, 20, 40],
    [4, -30, 30, 80],
    [6, -40, 40, 120],
    [8, -50, 50, 160],
  ] as const)('defines %s-deck broad defaults and theoretical limits', (shoe, minimum, maximum, theoretical) => {
    expect(getDefaultShoeRunningCountRange(shoe)).toEqual({ minimum, maximum });
    expect(getTheoreticalRunningCountBound(shoe)).toBe(theoretical);
  });

  it('handles a 1-deck shoe at the start and midpoint', () => {
    expect(getRunningCountBounds(1, 1)).toMatchObject({ minimum: 0, maximum: 0 });
    expect(getRunningCountBounds(1, 0.5)).toMatchObject({ minimum: -10, maximum: 10 });
  });

  it('handles a 2-deck shoe', () => {
    expect(getRunningCountBounds(2, 1.5)).toMatchObject({ minimum: -10, maximum: 10 });
    expect(getRunningCountBounds(2, 1)).toMatchObject({ minimum: -20, maximum: 20 });
  });

  it('narrows a 6-deck shoe with 5.5 decks remaining', () => {
    expect(getRunningCountBounds(6, 5.5)).toMatchObject({
      minimum: -10,
      maximum: 10,
      exposureBound: 10,
    });
  });

  it('uses the broad default at 3 decks remaining from 6', () => {
    expect(getRunningCountBounds(6, 3)).toMatchObject({ minimum: -40, maximum: 40 });
  });

  it('narrows an 8-deck shoe early and late', () => {
    expect(getRunningCountBounds(8, 7.5)).toMatchObject({ minimum: -10, maximum: 10 });
    expect(getRunningCountBounds(8, 1)).toMatchObject({ minimum: -50, maximum: 50, remainingBound: 52 });
  });

  it('preserves asymmetric custom boundaries while enforcing physical limits', () => {
    expect(getRunningCountBounds(6, 3, { minimum: -120, maximum: 75 })).toMatchObject({
      minimum: -60,
      maximum: 60,
      theoreticalBound: 120,
    });
    expect(getRunningCountBounds(6, 5.5, { minimum: -120, maximum: 120 })).toMatchObject({
      minimum: -10,
      maximum: 10,
    });
  });

  it('clamps custom ranges to the selected shoe theoretical limit', () => {
    expect(clampConfiguredRangeToTheoreticalBound(2, { minimum: -100, maximum: 100 })).toEqual({
      minimum: -40,
      maximum: 40,
    });
  });

  it('recognizes positive and negative possible boundaries', () => {
    expect(isRunningCountPossible(-10, 6, 5.5)).toBe(true);
    expect(isRunningCountPossible(10, 6, 5.5)).toBe(true);
    expect(isRunningCountPossible(-11, 6, 5.5)).toBe(false);
    expect(isRunningCountPossible(11, 6, 5.5)).toBe(false);
  });

  it('keeps mixed-mode questions inside the chosen shoe bounds', () => {
    let state = 17;
    const random = () => {
      state = (state * 48_271) % 2_147_483_647;
      return state / 2_147_483_647;
    };

    for (let index = 0; index < 200; index += 1) {
      const question = generateTrueCountQuestion(DEFAULT_TRUE_COUNT_SETTINGS, random);
      expect(SHOE_SIZES).toContain(question.shoeSize);
      expect(isRunningCountPossible(question.runningCount, question.shoeSize, question.decksRemaining)).toBe(true);
      const defaultBounds = getRunningCountBounds(question.shoeSize, question.decksRemaining);
      expect(question.runningCount).toBeGreaterThanOrEqual(defaultBounds.minimum);
      expect(question.runningCount).toBeLessThanOrEqual(defaultBounds.maximum);
    }
  });
});
