jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { parseCardSoundsEnabled } from '@/hooks/useCardSoundPreference';

describe('shared card sound preference', () => {
  it('restores enabled and disabled values', () => {
    expect(parseCardSoundsEnabled('true')).toBe(true);
    expect(parseCardSoundsEnabled('false')).toBe(false);
    expect(parseCardSoundsEnabled(JSON.stringify({ cardSoundsEnabled: false }))).toBe(false);
  });

  it('uses a safe fallback for invalid values', () => {
    expect(parseCardSoundsEnabled('invalid', true)).toBe(true);
    expect(parseCardSoundsEnabled(null, false)).toBe(false);
  });
});
