import { updatePersonalBestCollection } from '../personalBests';
import type { RunningCountSessionSummary } from '../../types';

function summary(overrides: Partial<RunningCountSessionSummary> = {}): RunningCountSessionSummary {
  return {
    id: 'session', completedAt: '2026-01-01', mode: 'countdown', deckCount: 1,
    attempts: 1, correct: 1, accuracyPercentage: 100, elapsedTimeMs: 50000,
    totalCards: 52, finalCountCorrect: true, recommendation: 'Keep going.', ...overrides,
  };
}

describe('running count personal bests', () => {
  it('updates best valid time only after a correct run', () => {
    let records = updatePersonalBestCollection([], summary());
    records = updatePersonalBestCollection(records, summary({ elapsedTimeMs: 30000, finalCountCorrect: false, correct: 0, accuracyPercentage: 0 }));
    expect(records[0].bestValidTimeMs).toBe(50000);
    expect(records[0].recentValidTimesMs).toEqual([50000]);
  });

  it('keeps deck-specific records separate', () => {
    let records = updatePersonalBestCollection([], summary());
    records = updatePersonalBestCollection(records, summary({ deckCount: 6, elapsedTimeMs: 200000 }));
    expect(records).toHaveLength(2);
    expect(records.find((record) => record.deckCount === 1)?.bestValidTimeMs).toBe(50000);
    expect(records.find((record) => record.deckCount === 6)?.bestValidTimeMs).toBe(200000);
  });

  it('records the lowest successful speed by deck count', () => {
    let records = updatePersonalBestCollection([], summary({ mode: 'speed', dealIntervalMs: 750 }));
    records = updatePersonalBestCollection(records, summary({ mode: 'speed', dealIntervalMs: 600 }));
    records = updatePersonalBestCollection(records, summary({ mode: 'speed', dealIntervalMs: 500, finalCountCorrect: false }));
    expect(records[0].fastestSuccessfulDealMs).toBe(600);
  });
});
