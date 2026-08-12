import { EMPTY_SESSION_METRICS, recordAnswer } from '../sessionMetrics';

describe('recordAnswer', () => {
  it('tracks accuracy, streaks, and average response time', () => {
    const first = recordAnswer(EMPTY_SESSION_METRICS, true, 1000);
    const second = recordAnswer(first, true, 2000);
    const third = recordAnswer(second, false, 3000);

    expect(third).toMatchObject({
      attempted: 3,
      correct: 2,
      currentStreak: 0,
      bestStreak: 2,
      totalResponseTimeMs: 6000,
      averageResponseTimeMs: 2000,
    });
    expect(third.accuracyPercentage).toBeCloseTo(66.67, 2);
  });

  it('does not allow a negative response time to reduce the average', () => {
    const metrics = recordAnswer(EMPTY_SESSION_METRICS, false, -100);

    expect(metrics.totalResponseTimeMs).toBe(0);
    expect(metrics.averageResponseTimeMs).toBe(0);
  });
});
