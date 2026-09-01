import type { PlayingCardModel } from '@/lib/blackjack/cardTypes';
import type { SessionLength, SessionMetrics } from '@/types/training';

export type BasicStrategyRules = 'H17' | 'S17';
export type BasicStrategyAction = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';
export type StrategyInstruction = BasicStrategyAction | 'DOUBLE_OR_HIT' | 'DOUBLE_OR_STAND' | 'SPLIT_IF_DAS' | 'NO_SPLIT';
export type HandCategory = 'hard' | 'soft' | 'pair';
export type HandTotalDisplay = 'before' | 'after' | 'hidden';
export type BasicStrategyPracticeMode = 'standard' | 'category' | 'pattern-recall' | 'adaptive';
export type ResponseSpeed = 'automatic' | 'fast' | 'calculating' | 'needs-practice';

export interface BasicStrategySettings {
  rules: BasicStrategyRules;
  handTotalDisplay: HandTotalDisplay;
  cardSoundsEnabled: boolean;
  sessionLength: SessionLength;
}

export interface TableRuleAssumptions {
  doubleAfterSplit: boolean;
  lateSurrender: boolean;
}

export interface StrategyAvailability {
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  doubleAfterSplit: boolean;
}

export interface HandPattern {
  category: HandCategory;
  value: number;
  label: string;
}

export interface BasicStrategyQuestion {
  id: string;
  playerCards: PlayingCardModel[];
  dealerUpcard: PlayingCardModel;
  category: HandCategory;
  pattern: HandPattern;
  correctAction: BasicStrategyAction;
  strategyFeedback: BasicStrategyDecisionFeedback;
  availableActions: BasicStrategyAction[];
}

export interface BasicStrategyDecisionFeedback {
  handClassification: string;
  correctAction: BasicStrategyAction;
  patternLabel: string;
  patternExplanation: string;
  activeRules: BasicStrategyRules;
  ruleCaveat: string | null;
}

export interface BasicStrategyFeedback {
  answer: BasicStrategyAction;
  correctAction: BasicStrategyAction;
  isCorrect: boolean;
  responseTimeMs: number;
  responseSpeed: ResponseSpeed;
}

export interface BasicStrategyAnswerRecord extends BasicStrategyFeedback {
  rules: BasicStrategyRules;
  category: HandCategory;
  patternLabel: string;
  dealerUpcardValue: string;
  answeredAt: string;
}

export interface BasicStrategyPerformanceStats {
  key: string;
  rules: BasicStrategyRules;
  category: HandCategory;
  patternLabel: string;
  dealerUpcardValue: string;
  attempted: number;
  correct: number;
  totalResponseTimeMs: number;
  automaticAnswers: number;
  lastPracticedAt: string;
}

export interface BasicStrategyPerformanceSummary extends BasicStrategyPerformanceStats {
  accuracyPercentage: number;
  averageResponseTimeMs: number;
  automaticPercentage: number;
}

export interface CategoryPerformanceSummary {
  category: HandCategory;
  attempted: number;
  correct: number;
  accuracyPercentage: number;
  averageResponseTimeMs: number;
}

export interface BasicStrategySessionOptions {
  mode: BasicStrategyPracticeMode;
  category?: HandCategory;
  pattern?: HandPattern;
}

export interface BasicStrategySessionState {
  settings: BasicStrategySettings;
  mode: BasicStrategyPracticeMode;
  category?: HandCategory;
  pattern?: HandPattern;
  recallDealerOrder?: string[];
  recallIndex: number;
  metrics: SessionMetrics;
  answers: BasicStrategyAnswerRecord[];
  currentQuestion: BasicStrategyQuestion;
  questionStartedAt: number;
  feedback: BasicStrategyFeedback | null;
  hasReachedLimit: boolean;
}

export interface BasicStrategySessionSummary extends SessionMetrics {
  id: string;
  completedAt: string;
  rules: BasicStrategyRules;
  handTotalDisplay: HandTotalDisplay;
  sessionLength: SessionLength;
  mode: BasicStrategyPracticeMode;
  category?: HandCategory;
  pattern?: HandPattern;
  categoryPerformance: CategoryPerformanceSummary[];
  weakestHands: BasicStrategyPerformanceSummary[];
  weakestDealerUpcards: BasicStrategyPerformanceSummary[];
  recommendations: string[];
}
