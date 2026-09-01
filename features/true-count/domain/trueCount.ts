export function calculateTrueCount(runningCount: number, decksRemaining: number): number {
  if (!Number.isFinite(runningCount)) {
    throw new Error('Running count must be a finite number.');
  }

  if (!Number.isFinite(decksRemaining) || decksRemaining <= 0) {
    throw new Error('Decks remaining must be greater than zero.');
  }

  const trueCount = Math.trunc(runningCount / decksRemaining);

  // Math.trunc preserves JavaScript's negative zero; normalize it for display,
  // comparisons, and persisted results.
  return Object.is(trueCount, -0) ? 0 : trueCount;
}

export function formatSignedCount(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
