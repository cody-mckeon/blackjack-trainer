import { classifyResponseSpeed } from '../responseSpeed';

describe('classifyResponseSpeed', () => {
  it.each([
    [0, 'automatic'],
    [1_499, 'automatic'],
    [1_500, 'fast'],
    [2_999, 'fast'],
    [3_000, 'calculating'],
    [4_999, 'calculating'],
    [5_000, 'needs-practice'],
    [8_000, 'needs-practice'],
  ] as const)('classifies %sms as %s', (duration, expected) => {
    expect(classifyResponseSpeed(duration)).toBe(expected);
  });
});
