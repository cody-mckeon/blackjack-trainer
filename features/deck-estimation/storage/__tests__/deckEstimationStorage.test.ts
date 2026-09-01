jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';

import { deckEstimationStorage, parseDeckEstimationSettings } from '../deckEstimationStorage';

describe('deck estimation persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restores valid whole- and quarter-deck settings', () => {
    expect(parseDeckEstimationSettings(JSON.stringify({ shoeSize: 8, precision: 'whole', sessionLength: 50 }))).toEqual({
      shoeSize: 8,
      precision: 'whole',
      sessionLength: 50,
    });
    expect(parseDeckEstimationSettings(JSON.stringify({ shoeSize: 6, precision: 'quarter', sessionLength: 25 }))).toEqual({
      shoeSize: 6,
      precision: 'quarter',
      sessionLength: 25,
    });
  });

  it('round trips settings and the fastest perfect average', async () => {
    await deckEstimationStorage.saveSettings({ shoeSize: 'mixed', precision: 'mixed', sessionLength: 'endless' });
    await deckEstimationStorage.saveFastestPerfectAverageMs(1234);
    await expect(deckEstimationStorage.getSettings()).resolves.toEqual({
      shoeSize: 'mixed',
      precision: 'mixed',
      sessionLength: 'endless',
    });
    await expect(deckEstimationStorage.getFastestPerfectAverageMs()).resolves.toBe(1234);
  });
});
