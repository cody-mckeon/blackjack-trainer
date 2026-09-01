import { DEALER_UPCARD_VALUES } from '../../constants';
import { createPatternRecallDealerOrder, generatePatternRecallQuestion } from '../patternRecall';
import { getDealerValue } from '../strategyLookup';

describe('pattern recall', () => {
  it('creates one randomized cycle containing every dealer upcard', () => {
    const order = createPatternRecallDealerOrder(() => 0.4);
    expect(order).toHaveLength(10);
    expect([...order].sort()).toEqual([...DEALER_UPCARD_VALUES].sort());
  });

  it('keeps the selected pattern and advances through dealer values', () => {
    const pattern = { category: 'soft', value: 18, label: 'Soft 18' } as const;
    const order = ['2', 'A', '6'];
    expect(getDealerValue(generatePatternRecallQuestion(pattern, 'S17', order, 0).dealerUpcard)).toBe('2');
    expect(getDealerValue(generatePatternRecallQuestion(pattern, 'S17', order, 1).dealerUpcard)).toBe('A');
  });
});
