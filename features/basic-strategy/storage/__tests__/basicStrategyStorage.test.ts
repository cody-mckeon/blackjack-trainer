jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { parseBasicStrategySettings } from '../basicStrategyStorage';

describe('basic strategy setting persistence parsing', () => {
  it('defaults to reveal after, H17, and sounds on for a new user', () => {
    expect(parseBasicStrategySettings(null)).toMatchObject({ rules: 'H17', handTotalDisplay: 'after', cardSoundsEnabled: true });
  });

  it('restores S17, hidden totals, and disabled sounds', () => {
    expect(parseBasicStrategySettings(JSON.stringify({ rules: 'S17', handTotalDisplay: 'hidden', cardSoundsEnabled: false, sessionLength: 50 }))).toEqual({ rules: 'S17', handTotalDisplay: 'hidden', cardSoundsEnabled: false, sessionLength: 50 });
  });
});
