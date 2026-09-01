jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { parseRunningCountSettings } from '../runningCountStorage';

describe('running count settings storage', () => {
  it('uses stable defaults for missing settings', () => {
    expect(parseRunningCountSettings(null)).toMatchObject({ deckCount: 1, cardSoundsEnabled: true, countdownDealStyle: 'manual' });
  });

  it('validates restored settings', () => {
    expect(parseRunningCountSettings(JSON.stringify({
      deckCount: 8, cardSoundsEnabled: false, countdownDealStyle: 'auto', autoDealIntervalMs: 750,
      speedDealIntervalMs: 600, checkpointFrequency: 'random', cancellationChunkSize: 3, endlessDurationSeconds: 'endless',
    }))).toEqual({
      deckCount: 8, cardSoundsEnabled: false, countdownDealStyle: 'auto', autoDealIntervalMs: 750,
      speedDealIntervalMs: 600, checkpointFrequency: 'random', cancellationChunkSize: 3, endlessDurationSeconds: 'endless',
    });
  });
});
