import { generateTrueCountQuestion, getValidDecksRemaining } from '../questionGenerator';
import { DEFAULT_TRUE_COUNT_SETTINGS } from '../../constants';
import { SHOE_SIZES } from '../../types';

describe('getValidDecksRemaining', () => {
  it('generates half-deck values down to one deck', () => {
    expect(getValidDecksRemaining(2, 0.5)).toEqual([2, 1.5, 1]);
    expect(getValidDecksRemaining(6, 0.5)).toEqual([6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1]);
  });

  it('includes a playable half-deck point for a 1-deck shoe', () => {
    expect(getValidDecksRemaining(1, 0.5)).toEqual([1, 0.5]);
  });

  it.each(SHOE_SIZES)('never exceeds the %s-deck shoe boundary', (shoeSize) => {
    const values = getValidDecksRemaining(shoeSize, 0.5);

    expect(Math.max(...values)).toBe(shoeSize);
    const minimum = shoeSize === 1 ? 0.5 : 1;
    expect(Math.min(...values)).toBe(minimum);
    expect(values.every((value) => value <= shoeSize && value >= minimum)).toBe(true);
  });

  it('supports quarter-deck precision without changing the API', () => {
    expect(getValidDecksRemaining(2, 0.25)).toEqual([2, 1.75, 1.5, 1.25, 1]);
  });
});

describe('generateTrueCountQuestion', () => {
  it('generates a meaningful realistic scenario in a 1-deck shoe', () => {
    const question = generateTrueCountQuestion(
      { ...DEFAULT_TRUE_COUNT_SETTINGS, shoeSize: 1 },
      () => 0.9999,
    );

    expect(question.decksRemaining).toBe(0.5);
    expect(question.runningCount).toBe(10);
  });

  it('honors a custom running count range inside realistic bounds', () => {
    const question = generateTrueCountQuestion(
      {
        ...DEFAULT_TRUE_COUNT_SETTINGS,
        shoeSize: 4,
        runningCountRangeMode: 'custom',
        runningCountMin: -3,
        runningCountMax: -3,
      },
      () => 0,
      () => 123,
      { fixedDecksRemaining: 2 },
    );

    expect(question.shoeSize).toBe(4);
    expect(question.decksRemaining).toBe(2);
    expect(question.runningCount).toBe(-3);
    expect(question.answerChoices).toContain(question.correctAnswer);
  });

  it('keeps mixed shoes within supported boundaries', () => {
    const question = generateTrueCountQuestion(DEFAULT_TRUE_COUNT_SETTINGS, () => 0.99999);

    expect(question.shoeSize).toBe(8);
    expect(question.decksRemaining).toBe(1);
  });

  it('supports a fixed half-deck value for Pattern Recall', () => {
    const question = generateTrueCountQuestion(
      DEFAULT_TRUE_COUNT_SETTINGS,
      () => 0.5,
      () => 123,
      { fixedDecksRemaining: 3.5 },
    );

    expect(question.decksRemaining).toBe(3.5);
    expect(question.shoeSize).toBeGreaterThanOrEqual(3.5);
  });

  it('never generates an impossible custom running count', () => {
    const settings = {
      ...DEFAULT_TRUE_COUNT_SETTINGS,
      shoeSize: 6 as const,
      runningCountRangeMode: 'custom' as const,
      runningCountMin: -120,
      runningCountMax: 120,
    };

    expect(generateTrueCountQuestion(settings, () => 0, Date.now, { fixedDecksRemaining: 5.5 }).runningCount).toBe(-10);
    expect(generateTrueCountQuestion(settings, () => 0.9999, Date.now, { fixedDecksRemaining: 5.5 }).runningCount).toBe(10);
  });
});
