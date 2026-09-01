import { generateDeckEstimationQuestion, getValidDeckEstimates } from '../questionGenerator';

describe('deck estimation question generator', () => {
  it.each([2, 4, 6, 8] as const)('keeps whole-deck questions inside %i-deck boundaries', (startingDecks) => {
    const values = getValidDeckEstimates(startingDecks, 'whole');
    expect(values).toEqual(Array.from({ length: startingDecks }, (_, index) => startingDecks - index));
  });

  it.each([2, 4, 6, 8] as const)('creates half-deck landmarks for a %i-deck shoe', (startingDecks) => {
    const values = getValidDeckEstimates(startingDecks, 'half');
    expect(values.every((value) => value * 2 === Math.round(value * 2))).toBe(true);
    expect(values.every((value) => value >= 1 && value <= startingDecks)).toBe(true);
  });

  it.each([2, 4, 6, 8] as const)('creates quarter-deck landmarks for a %i-deck shoe', (startingDecks) => {
    const values = getValidDeckEstimates(startingDecks, 'quarter');
    expect(values.every((value) => value * 4 === Math.round(value * 4))).toBe(true);
    expect(values.every((value) => value >= 1 && value <= startingDecks)).toBe(true);
  });

  it('maps a quarter-deck question to the exact registered card-count interval', () => {
    const question = generateDeckEstimationQuestion(
      { startingDecks: 6, precision: 'quarter' },
      () => 0.1,
      () => 50,
    );

    expect(question.precision).toBe('quarter');
    expect(question.decksRemaining * 4).toBe(Math.round(question.decksRemaining * 4));
    expect(question.discardedCardCount % 13).toBe(0);
  });

  it('supports an allowed range without generating impossible values', () => {
    const question = generateDeckEstimationQuestion(
      { startingDecks: 6, precision: 'half', allowedRange: { minimum: 2.5, maximum: 4 } },
      () => 0.99,
      () => 100,
    );
    expect(question.decksRemaining).toBeGreaterThanOrEqual(2.5);
    expect(question.decksRemaining).toBeLessThanOrEqual(4);
    expect(question.decksRemaining).toBeLessThanOrEqual(question.startingDecks);
    expect(question.discardedCardCount).toBe(Math.round(question.decksPlayed * 52));
  });

  it('mixes shoe sizes and precision through injected randomness', () => {
    const samples = [0.99, 0.2, 0.4, 0.25];
    const question = generateDeckEstimationQuestion(
      { startingDecks: 'mixed', precision: 'mixed' },
      () => samples.shift() ?? 0,
      () => 200,
    );
    expect(question.startingDecks).toBe(8);
    expect(question.precision).toBe('whole');
    expect(question.decksRemaining).toBeGreaterThanOrEqual(1);
    expect(question.decksRemaining).toBeLessThanOrEqual(8);
  });
});
