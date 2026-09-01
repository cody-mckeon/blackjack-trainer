export type SessionLength = 10 | 25 | 50 | 'endless';

export interface SessionMetrics {
  attempted: number;
  correct: number;
  accuracyPercentage: number;
  currentStreak: number;
  bestStreak: number;
  averageResponseTimeMs: number;
  totalResponseTimeMs: number;
  automaticAnswers: number;
  automaticPercentage: number;
}
