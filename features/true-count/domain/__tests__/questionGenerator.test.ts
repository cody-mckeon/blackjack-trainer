import { generateTrueCountQuestion, getValidDecksRemaining } from '../questionGenerator';
import { DEFAULT_TRUE_COUNT_SETTINGS } from '../../constants';
import { SHOE_SIZES } from '../../types';

describe('getValidDecksRemaining', () => {
  it('generates half-deck values down to one deck', () => {
    expect(getValidDecksRemaining(2, 0.5)).toEqual([2, 1.5, 1]);
    expect(getValidDecksRemaining(6, 0.5)).toEqual([6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1]);
  });

  it.each(SHOE_SIZES)('never exceeds the %s-deck shoe boundary', (shoeSize) => {
    const values = getValidDecksRemaining(shoeSize, 0.5);

    expect(Math.max(...values)).toBe(shoeSize);
    expect(Math.min(...values)).toBe(1);
    expect(values.every((value) => value <= shoeSize && value >= 1)).toBe(true);
  });

  it('supports quarter-deck precision without changing the API', () => {
    expect(getValidDecksRemaining(2, 0.25)).toEqual([2, 1.75, 1.5, 1.25, 1]);
  });
});

describe('generateTrueCountQuestion', () => {
  it('honors a specific shoe size and running count boundaries', () => {
    const question = generateTrueCountQuestion(
      {
        ...DEFAULT_TRUE_COUNT_SETTINGS,
        shoeSize: 4,
        runningCountMin: -3,
        runningCountMax: -3,
      },
      () => 0,
      () => 123,
    );

    expect(question.shoeSize).toBe(4);
    expect(question.decksRemaining).toBe(4);
    expect(question.runningCount).toBe(-3);
    expect(question.answerChoices).toContain(question.correctAnswer);
  });

  it('keeps mixed shoes within supported boundaries', () => {
    const question = generateTrueCountQuestion(DEFAULT_TRUE_COUNT_SETTINGS, () => 0.99999);

    expect(question.shoeSize).toBe(8);
    expect(question.decksRemaining).toBe(1);
  });
});
