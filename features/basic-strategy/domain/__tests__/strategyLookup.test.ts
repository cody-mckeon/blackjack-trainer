import { getBasicStrategyAction } from '../strategyLookup';

const c = (rank: any, suit: any = 'spades') => ({ rank, suit });

describe('Blackjack Apprenticeship strategy lookups', () => {
  it.each(['H17', 'S17'] as const)('covers tricky common patterns under %s', (rules) => {
    expect(getBasicStrategyAction([c('5'), c('4', 'hearts')], c('2'), rules)).toBe('HIT');
    expect(getBasicStrategyAction([c('5'), c('4', 'hearts')], c('3'), rules)).toBe('DOUBLE');
    expect(getBasicStrategyAction([c('A'), c('7', 'hearts')], c('8'), rules)).toBe('STAND');
    expect(getBasicStrategyAction([c('9'), c('9', 'hearts')], c('7'), rules)).toBe('STAND');
    expect(getBasicStrategyAction([c('9'), c('9', 'hearts')], c('8'), rules)).toBe('SPLIT');
  });

  it('encodes known H17/S17 differences', () => {
    expect(getBasicStrategyAction([c('6'), c('5', 'hearts')], c('A'), 'H17')).toBe('DOUBLE');
    expect(getBasicStrategyAction([c('6'), c('5', 'hearts')], c('A'), 'S17')).toBe('HIT');
    expect(getBasicStrategyAction([c('A'), c('7', 'hearts')], c('2'), 'H17')).toBe('DOUBLE');
    expect(getBasicStrategyAction([c('A'), c('7', 'hearts')], c('2'), 'S17')).toBe('STAND');
    expect(getBasicStrategyAction([c('A'), c('8', 'hearts')], c('6'), 'H17')).toBe('DOUBLE');
    expect(getBasicStrategyAction([c('A'), c('8', 'hearts')], c('6'), 'S17')).toBe('STAND');
    expect(getBasicStrategyAction([c('10'), c('5', 'hearts')], c('A'), 'H17')).toBe('SURRENDER');
    expect(getBasicStrategyAction([c('10'), c('5', 'hearts')], c('A'), 'S17')).toBe('HIT');
  });

  it('honors double and DAS fallback behavior', () => {
    expect(getBasicStrategyAction([c('A'), c('7', 'hearts')], c('2'), 'H17', { canDouble: false })).toBe('STAND');
    expect(getBasicStrategyAction([c('4'), c('4', 'hearts')], c('5'), 'H17', { doubleAfterSplit: false })).toBe('HIT');
    expect(getBasicStrategyAction([c('6'), c('6', 'hearts')], c('2'), 'H17', { doubleAfterSplit: false })).toBe('HIT');
  });

  it('uses late surrender before pair splitting where the source chart specifies it', () => {
    expect(getBasicStrategyAction([c('8'), c('8', 'hearts')], c('A'), 'H17')).toBe('SURRENDER');
    expect(getBasicStrategyAction([c('8'), c('8', 'hearts')], c('A'), 'S17')).toBe('SPLIT');
  });

  it('does not apply hard surrender rows to soft hands with the same total', () => {
    expect(getBasicStrategyAction([c('A'), c('4', 'hearts')], c('10'), 'H17')).toBe('HIT');
    expect(getBasicStrategyAction([c('A'), c('4', 'hearts')], c('A'), 'H17')).toBe('HIT');
    expect(getBasicStrategyAction([c('A'), c('5', 'hearts')], c('10'), 'S17')).toBe('HIT');
  });
});
