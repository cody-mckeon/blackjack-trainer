import { calculateDiscardStackHeight, calculateVariedStackHeight } from '../DiscardTray';
import { createTrayVisualVariation } from '@/features/deck-estimation/domain/questionGenerator';

describe('DiscardTray card-count rendering model', () => {
  it('accepts actual card counts and grows monotonically', () => {
    expect(calculateDiscardStackHeight(0)).toBe(0);
    expect(calculateDiscardStackHeight(52)).toBeGreaterThan(0);
    expect(calculateDiscardStackHeight(104)).toBeGreaterThan(calculateDiscardStackHeight(52));
    expect(calculateDiscardStackHeight(156)).toBeGreaterThan(calculateDiscardStackHeight(104));
  });

  it('keeps variation restrained without changing the underlying card-count height', () => {
    const first = createTrayVisualVariation(1);
    const second = createTrayVisualVariation(2);
    expect(first).not.toEqual(second);
    expect(calculateDiscardStackHeight(104)).toBe(calculateDiscardStackHeight(104));
    expect(calculateVariedStackHeight(104, first)).toBeGreaterThan(calculateDiscardStackHeight(104) * 0.96);
    expect(calculateVariedStackHeight(104, second)).toBeLessThanOrEqual(calculateDiscardStackHeight(104));
  });
});
