import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import type { DeckCount } from '@/lib/blackjack/shoe';
import type { HiLoCategory } from '@/lib/blackjack/hiLo';

export type RunningCountMode = 'countdown' | 'hidden-card' | 'checkpoint' | 'speed' | 'cancellation' | 'endless';
export type DealStyle = 'manual' | 'auto';
export type CheckpointFrequency = 5 | 10 | 20 | 'random';
export type EndlessDuration = 60 | 120 | 'endless';

export interface RunningCountSettings {
  deckCount: DeckCount;
  cardSoundsEnabled: boolean;
  countdownDealStyle: DealStyle;
  autoDealIntervalMs: number;
  speedDealIntervalMs: number;
  checkpointFrequency: CheckpointFrequency;
  cancellationChunkSize: 2 | 3;
  endlessDurationSeconds: EndlessDuration;
}

export interface CheckpointResult {
  cardPosition: number;
  userAnswer: number;
  actualCount: number;
  isCorrect: boolean;
  responseTimeMs: number;
}

export interface RunningCountSessionSummary {
  id: string;
  completedAt: string;
  mode: RunningCountMode;
  deckCount: DeckCount;
  attempts: number;
  correct: number;
  accuracyPercentage: number;
  elapsedTimeMs: number;
  totalCards: number;
  cardsPerSecond?: number;
  finalUserAnswer?: number;
  actualFinalCount?: number;
  finalCountCorrect?: boolean;
  hiddenCategoryAnswer?: HiLoCategory;
  hiddenCategoryActual?: HiLoCategory;
  hiddenCategoryCorrect?: boolean;
  hiddenCard?: PlayingCardModel;
  checkpointResults?: CheckpointResult[];
  firstIncorrectCheckpoint?: number;
  longestCorrectStreak?: number;
  currentStreak?: number;
  averageResponseTimeMs?: number;
  dealIntervalMs?: number;
  errorTypes?: Record<string, number>;
  recommendation: string;
}

export interface RunningCountPersonalBest {
  key: string;
  mode: RunningCountMode;
  deckCount: DeckCount;
  bestValidTimeMs?: number;
  recentValidTimesMs: number[];
  averageValidTimeMs?: number;
  fastestSuccessfulDealMs?: number;
  currentStreak: number;
  bestStreak: number;
  attempts: number;
  successfulAttempts: number;
}
