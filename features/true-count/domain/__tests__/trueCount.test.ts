import { calculateTrueCount } from '../trueCount';

describe('calculateTrueCount', () => {
  it.each([
    [7, 3, 2],
    [5, 2, 2],
    [1, 2.5, 0],
    [8, 3.5, 2],
  ])('truncates %s / %s toward zero to %s', (runningCount, decksRemaining, expected) => {
    expect(calculateTrueCount(runningCount, decksRemaining)).toBe(expected);
  });

  it.each([
    [-5, 2, -2],
    [-7, 3, -2],
    [-1, 2.5, 0],
  ])('truncates negative %s / %s toward zero to %s', (runningCount, decksRemaining, expected) => {
    expect(calculateTrueCount(runningCount, decksRemaining)).toBe(expected);
  });

  it('rejects zero or negative decks remaining', () => {
    expect(() => calculateTrueCount(5, 0)).toThrow();
    expect(() => calculateTrueCount(5, -1)).toThrow();
  });
});
