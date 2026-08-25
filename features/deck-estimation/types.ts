import type { SessionLength, SessionMetrics } from '@/types/training';

export const DECK_ESTIMATION_SHOE_SIZES = [2, 4, 6, 8] as const;

export type DeckEstimationShoeSize = (typeof DECK_ESTIMATION_SHOE_SIZES)[number];
export type DeckEstimationShoeSelection = DeckEstimationShoeSize | 'mixed';
export type DeckEstimationPrecision = 'whole' | 'half' | 'mixed';
export type DeckEstimationMode = 'whole' | 'half' | 'mixed';
export type DeckEstimationResponseSpeed = 'automatic' | 'fast' | 'calculating' | 'needs-practice';

export interface DeckEstimationSettings {
  shoeSize: DeckEstimationShoeSelection;
  precision: DeckEstimationPrecision;
  sessionLength: SessionLength;
}

export interface DeckEstimateRange {
  minimum?: number;
  maximum?: number;
}

export interface TrayVisualVariation {
  seed: number;
  compression: number;
  leanDegrees: number;
  horizontalOffset: number;
}

export interface DeckEstimationQuestion {
  id: string;
  startingDecks: DeckEstimationShoeSize;
  precision: Exclude<DeckEstimationPrecision, 'mixed'>;
  decksRemaining: number;
  decksPlayed: number;
  discardedCardCount: number;
  answerChoices: number[];
  visualVariation: TrayVisualVariation;
}

export interface DeckEstimationFeedback {
  answer: number;
  correctAnswer: number;
  isCorrect: boolean;
  responseTimeMs: number;
  responseSpeed: DeckEstimationResponseSpeed;
}

export interface DeckEstimationAnswerRecord extends DeckEstimationFeedback {
  startingDecks: DeckEstimationShoeSize;
  decksPlayed: number;
  discardedCardCount: number;
  answeredAt: string;
}

export interface DeckEstimatePerformance {
  decksRemaining: number;
  attempted: number;
  correct: number;
  totalResponseTimeMs: number;
  automaticAnswers: number;
  accuracyPercentage: number;
  averageResponseTimeMs: number;
  automaticPercentage: number;
  mostCommonWrongAnswer?: number;
}

export interface DeckEstimateHistoryEntry {
  decksRemaining: number;
  attempted: number;
  correct: number;
  totalResponseTimeMs: number;
  automaticAnswers: number;
  confusions: Record<string, number>;
  lastPracticedAt: string;
}

export interface ConfusionPair {
  expected: number;
  answered: number;
  count: number;
}

export interface DeckEstimationSessionState {
  settings: DeckEstimationSettings;
  metrics: SessionMetrics;
  answers: DeckEstimationAnswerRecord[];
  currentQuestion: DeckEstimationQuestion;
  questionStartedAt: number;
  feedback: DeckEstimationFeedback | null;
  hasReachedLimit: boolean;
}

export interface DeckEstimationSessionSummary extends SessionMetrics {
  id: string;
  completedAt: string;
  shoeSize: DeckEstimationShoeSelection;
  precision: DeckEstimationPrecision;
  sessionLength: SessionLength;
  performance: DeckEstimatePerformance[];
  weakestEstimates: DeckEstimatePerformance[];
  confusionPairs: ConfusionPair[];
}
