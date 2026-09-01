import { createPatternCue, generatePatternRanges } from '../patternRanges';

describe('generatePatternRanges', () => {
  it('generates positive landmarks for a half-deck value', () => {
    const positive = generatePatternRanges(3.5).filter((range) => range.trueCount > 0);

    expect(positive).toEqual([
      { trueCount: 1, minimumRunningCount: 4, maximumRunningCount: 6 },
      { trueCount: 2, minimumRunningCount: 7, maximumRunningCount: 10 },
      { trueCount: 3, minimumRunningCount: 11, maximumRunningCount: 13 },
      { trueCount: 4, minimumRunningCount: 14, maximumRunningCount: 17 },
    ]);
  });

  it('generates equivalent negative landmarks toward zero', () => {
    const negative = generatePatternRanges(3.5).filter((range) => range.trueCount < 0);

    expect(negative).toEqual([
      { trueCount: -1, minimumRunningCount: -6, maximumRunningCount: -4 },
      { trueCount: -2, minimumRunningCount: -10, maximumRunningCount: -7 },
      { trueCount: -3, minimumRunningCount: -13, maximumRunningCount: -11 },
      { trueCount: -4, minimumRunningCount: -17, maximumRunningCount: -14 },
    ]);
  });

  it('creates a concise boundary cue from generated ranges', () => {
    expect(createPatternCue(10, 3.5)).toBe(
      'At 3.5 decks, RC +7 to +10 maps to TC +2. +11 begins TC +3.',
    );
    expect(createPatternCue(-10, 3.5)).toBe(
      'At 3.5 decks, RC -10 to -7 maps to TC -2. -11 begins TC -3.',
    );
  });
});
