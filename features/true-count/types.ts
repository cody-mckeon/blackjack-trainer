import type { SessionLength, SessionMetrics } from '@/types/training';

export const SHOE_SIZES = [1, 2, 4, 6, 8] as const;

export type ShoeSize = (typeof SHOE_SIZES)[number];
export type ShoeSizeSelection = ShoeSize | 'mixed';
export type DeckPrecision = 1 | 0.5 | 0.25;

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
}

export interface TrueCountSessionState {
  settings: TrueCountSettings;
  metrics: SessionMetrics;
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
}
