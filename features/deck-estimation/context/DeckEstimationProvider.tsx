import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  CONFUSION_PAIR_LIMIT,
  DEFAULT_DECK_ESTIMATION_SETTINGS,
  RECENT_DECK_ESTIMATION_SESSION_LIMIT,
  WEAKEST_ESTIMATE_LIMIT,
} from '../constants';
import { generateDeckEstimationQuestion } from '../domain/questionGenerator';
import { classifyDeckEstimationResponseSpeed } from '../domain/responseSpeed';
import {
  aggregateDeckEstimatePerformance,
  EMPTY_DECK_ESTIMATION_METRICS,
  findMostCommonConfusions,
  rankWeakestDeckEstimates,
  recordDeckEstimationAnswer,
  updateDeckEstimateHistory,
} from '../domain/statistics';
import { deckEstimationStorage } from '../storage/deckEstimationStorage';
import type {
  DeckEstimateHistoryEntry,
  DeckEstimationAnswerRecord,
  DeckEstimationSessionState,
  DeckEstimationSessionSummary,
  DeckEstimationSettings,
} from '../types';

interface DeckEstimationContextValue {
  settings: DeckEstimationSettings;
  isLoading: boolean;
  recentSessions: DeckEstimationSessionSummary[];
  performanceHistory: DeckEstimateHistoryEntry[];
  fastestPerfectAverageMs: number | null;
  session: DeckEstimationSessionState | null;
  lastSummary: DeckEstimationSessionSummary | null;
  saveSettings: (settings: DeckEstimationSettings) => Promise<void>;
  startSession: (settings?: DeckEstimationSettings) => void;
  markQuestionVisible: (questionId: string) => void;
  submitAnswer: (answer: number) => void;
  nextQuestion: () => void;
  endSession: () => DeckEstimationSessionSummary | null;
  clearSession: () => void;
}

const DeckEstimationContext = createContext<DeckEstimationContextValue | undefined>(undefined);

function createSummary(session: DeckEstimationSessionState): DeckEstimationSessionSummary {
  const performance = aggregateDeckEstimatePerformance(session.answers);
  return {
    ...session.metrics,
    id: `${Date.now()}-${session.metrics.attempted}`,
    completedAt: new Date().toISOString(),
    shoeSize: session.settings.shoeSize,
    precision: session.settings.precision,
    sessionLength: session.settings.sessionLength,
    performance,
    weakestEstimates: rankWeakestDeckEstimates(performance, WEAKEST_ESTIMATE_LIMIT),
    confusionPairs: findMostCommonConfusions(session.answers, CONFUSION_PAIR_LIMIT),
  };
}

function createSession(settings: DeckEstimationSettings): DeckEstimationSessionState {
  return {
    settings,
    metrics: EMPTY_DECK_ESTIMATION_METRICS,
    answers: [],
    currentQuestion: generateDeckEstimationQuestion({
      startingDecks: settings.shoeSize,
      precision: settings.precision,
    }),
    questionStartedAt: Date.now(),
    feedback: null,
    hasReachedLimit: false,
  };
}

export function DeckEstimationProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_DECK_ESTIMATION_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [recentSessions, setRecentSessions] = useState<DeckEstimationSessionSummary[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<DeckEstimateHistoryEntry[]>([]);
  const [fastestPerfectAverageMs, setFastestPerfectAverageMs] = useState<number | null>(null);
  const [session, setSession] = useState<DeckEstimationSessionState | null>(null);
  const [lastSummary, setLastSummary] = useState<DeckEstimationSessionSummary | null>(null);
  const sessionRef = useRef<DeckEstimationSessionState | null>(null);
  const visibleQuestionIdRef = useRef<string | null>(null);
  const sessionsRef = useRef<DeckEstimationSessionSummary[]>([]);
  const historyRef = useRef<DeckEstimateHistoryEntry[]>([]);
  const fastestRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      deckEstimationStorage.getSettings(),
      deckEstimationStorage.getRecentSessions(),
      deckEstimationStorage.getPerformanceHistory(),
      deckEstimationStorage.getFastestPerfectAverageMs(),
    ])
      .then(([storedSettings, sessions, history, fastest]) => {
        if (!active) return;
        setSettings(storedSettings);
        setRecentSessions(sessions);
        setPerformanceHistory(history);
        setFastestPerfectAverageMs(fastest);
        sessionsRef.current = sessions;
        historyRef.current = history;
        fastestRef.current = fastest;
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const saveSettings = useCallback(async (next: DeckEstimationSettings) => {
    setSettings(next);
    await deckEstimationStorage.saveSettings(next).catch(() => undefined);
  }, []);

  const startSession = useCallback((nextSettings = settings) => {
    setLastSummary(null);
    const next = createSession(nextSettings);
    visibleQuestionIdRef.current = null;
    sessionRef.current = next;
    setSession(next);
  }, [settings]);

  const markQuestionVisible = useCallback((questionId: string) => {
    const current = sessionRef.current;
    if (
      !current ||
      current.currentQuestion.id !== questionId ||
      current.feedback ||
      visibleQuestionIdRef.current === questionId
    ) return;
    visibleQuestionIdRef.current = questionId;
    const next = { ...current, questionStartedAt: Date.now() };
    sessionRef.current = next;
    setSession(next);
  }, []);

  const submitAnswer = useCallback((answer: number) => {
    const current = sessionRef.current;
    if (!current || current.feedback) return;
    const answeredAt = Date.now();
    const isCorrect = answer === current.currentQuestion.decksRemaining;
    const responseTimeMs = Math.max(0, answeredAt - current.questionStartedAt);
    const responseSpeed = classifyDeckEstimationResponseSpeed(responseTimeMs);
    const metrics = recordDeckEstimationAnswer(current.metrics, isCorrect, responseTimeMs);
    const hasReachedLimit =
      current.settings.sessionLength !== 'endless' && metrics.attempted >= current.settings.sessionLength;
    const record: DeckEstimationAnswerRecord = {
      answer,
      correctAnswer: current.currentQuestion.decksRemaining,
      isCorrect,
      responseTimeMs,
      responseSpeed,
      startingDecks: current.currentQuestion.startingDecks,
      decksPlayed: current.currentQuestion.decksPlayed,
      discardedCardCount: current.currentQuestion.discardedCardCount,
      answeredAt: new Date(answeredAt).toISOString(),
    };
    const next: DeckEstimationSessionState = {
      ...current,
      metrics,
      answers: [...current.answers, record],
      feedback: {
        answer,
        correctAnswer: current.currentQuestion.decksRemaining,
        isCorrect,
        responseTimeMs,
        responseSpeed,
      },
      hasReachedLimit,
    };
    const updatedHistory = updateDeckEstimateHistory(historyRef.current, record);
    sessionRef.current = next;
    setSession(next);
    historyRef.current = updatedHistory;
    setPerformanceHistory(updatedHistory);
    void deckEstimationStorage.savePerformanceHistory(updatedHistory).catch(() => undefined);
  }, []);

  const nextQuestion = useCallback(() => {
    const current = sessionRef.current;
    if (!current || !current.feedback || current.hasReachedLimit) return;
    const next: DeckEstimationSessionState = {
      ...current,
      currentQuestion: generateDeckEstimationQuestion({
        startingDecks: current.settings.shoeSize,
        precision: current.settings.precision,
      }),
      questionStartedAt: Date.now(),
      feedback: null,
    };
    visibleQuestionIdRef.current = null;
    sessionRef.current = next;
    setSession(next);
  }, []);

  const endSession = useCallback(() => {
    const current = sessionRef.current;
    if (!current || current.metrics.attempted === 0) return null;
    const summary = createSummary(current);
    const sessions = [summary, ...sessionsRef.current].slice(0, RECENT_DECK_ESTIMATION_SESSION_LIMIT);
    const isPerfect = summary.correct === summary.attempted;
    const isNewBest =
      isPerfect && (fastestRef.current === null || summary.averageResponseTimeMs < fastestRef.current);

    setLastSummary(summary);
    sessionsRef.current = sessions;
    setRecentSessions(sessions);
    sessionRef.current = null;
    visibleQuestionIdRef.current = null;
    setSession(null);
    void deckEstimationStorage.saveRecentSessions(sessions).catch(() => undefined);
    if (isNewBest) {
      fastestRef.current = summary.averageResponseTimeMs;
      setFastestPerfectAverageMs(summary.averageResponseTimeMs);
      void deckEstimationStorage.saveFastestPerfectAverageMs(summary.averageResponseTimeMs).catch(() => undefined);
    }
    return summary;
  }, []);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    visibleQuestionIdRef.current = null;
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    settings,
    isLoading,
    recentSessions,
    performanceHistory,
    fastestPerfectAverageMs,
    session,
    lastSummary,
    saveSettings,
    startSession,
    markQuestionVisible,
    submitAnswer,
    nextQuestion,
    endSession,
    clearSession,
  }), [
    settings,
    isLoading,
    recentSessions,
    performanceHistory,
    fastestPerfectAverageMs,
    session,
    lastSummary,
    saveSettings,
    startSession,
    markQuestionVisible,
    submitAnswer,
    nextQuestion,
    endSession,
    clearSession,
  ]);

  return <DeckEstimationContext.Provider value={value}>{children}</DeckEstimationContext.Provider>;
}

export function useDeckEstimation() {
  const context = useContext(DeckEstimationContext);
  if (!context) throw new Error('useDeckEstimation must be used inside DeckEstimationProvider.');
  return context;
}
