import { formatHandReveal, shouldShowHandTotal } from '../handTotalDisplay';

describe('Hand Total Display', () => {
  it('shows before, reveals after by default, and stays hidden', () => {
    expect(shouldShowHandTotal('before', false)).toBe(true);
    expect(shouldShowHandTotal('after', false)).toBe(false);
    expect(shouldShowHandTotal('after', true)).toBe(true);
    expect(shouldShowHandTotal('hidden', true)).toBe(false);
  });

  it('formats card math and classification', () => {
    expect(formatHandReveal([{ rank: 'A', suit: 'spades' }, { rank: '7', suit: 'diamonds' }])).toBe('A♠ + 7♦ = Soft 18');
    expect(formatHandReveal([{ rank: '9', suit: 'spades' }, { rank: '9', suit: 'diamonds' }])).toBe('9♠ + 9♦ = Pair of 9s / Hard 18');
  });
});
