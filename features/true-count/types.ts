import type { SessionLength, SessionMetrics } from '@/types/training';

export const SHOE_SIZES = [1, 2, 4, 6, 8] as const;

export type ShoeSize = (typeof SHOE_SIZES)[number];
export type ShoeSizeSelection = ShoeSize | 'mixed';
export type DeckPrecision = 1 | 0.5 | 0.25;
export type TrueCountPracticeMode = 'standard' | 'adaptive' | 'pattern-recall';
export type ResponseSpeed = 'automatic' | 'fast' | 'calculating' | 'needs-practice';

export const PATTERN_DECK_VALUES = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1] as const;
export type PatternDecksRemaining = (typeof PATTERN_DECK_VALUES)[number];

export interface TrueCountSettings {
  shoeSize: ShoeSizeSelection;
  runningCountMin: number;
  runningCountMax: number;
  deckPrecision: DeckPrecision;
  sessionLength: SessionLength;
}

export interface TrueCountQuestion {
  id: string;
  shoeSize: ShoeSize;
  runningCount: number;
  decksRemaining: number;
  correctAnswer: number;
  answerChoices: number[];
}

export interface AnswerFeedback {
  answer: number;
  correctAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  responseSpeed: ResponseSpeed;
}

export interface TrueCountAnswerRecord {
  decksRemaining: number;
  runningCount: number;
  correctAnswer: number;
  answer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  responseSpeed: ResponseSpeed;
  answeredAt: string;
}

export interface DeckPerformanceStats {
  decksRemaining: number;
  attempted: number;
  correct: number;
  totalResponseTimeMs: number;
  automaticAnswers: number;
  lastPracticedAt: string;
  runningCounts: Record<string, RunningCountPerformanceStats>;
}

export interface RunningCountPerformanceStats {
  runningCount: number;
  attempted: number;
  correct: number;
  totalResponseTimeMs: number;
  lastPracticedAt: string;
}

export interface DeckPerformanceSummary extends DeckPerformanceStats {
  accuracyPercentage: number;
  averageResponseTimeMs: number;
  automaticPercentage: number;
}

export interface TrueCountSessionOptions {
  mode: TrueCountPracticeMode;
  patternDecksRemaining?: PatternDecksRemaining;
}

export interface TrueCountSessionState {
  settings: TrueCountSettings;
  mode: TrueCountPracticeMode;
  patternDecksRemaining?: PatternDecksRemaining;
  metrics: SessionMetrics;
  answers: TrueCountAnswerRecord[];
  currentQuestion: TrueCountQuestion;
  questionStartedAt: number;
  feedback: AnswerFeedback | null;
  hasReachedLimit: boolean;
}

export interface TrueCountSessionSummary extends SessionMetrics {
  id: string;
  completedAt: string;
  shoeSize: ShoeSizeSelection;
  sessionLength: SessionLength;
  mode: TrueCountPracticeMode;
  deckPerformance: DeckPerformanceSummary[];
  weakestPatterns: DeckPerformanceSummary[];
  recommendation: string;
  patternDecksRemaining?: PatternDecksRemaining;
}
