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

import { DEFAULT_TRUE_COUNT_SETTINGS, RECENT_SESSION_LIMIT, WEAK_PATTERN_LIMIT } from '../constants';
import {
  calculateAdaptiveRunningCountWeights,
  calculateAdaptiveWeights,
  chooseWeightedDeckValue,
  chooseWeightedRunningCount,
} from '../domain/adaptiveWeighting';
import { generateTrueCountQuestion } from '../domain/questionGenerator';
import { aggregateAnswerRecords, rankWeakestPatterns, updatePerformanceHistory } from '../domain/performance';
import { createSessionRecommendation } from '../domain/recommendations';
import { classifyResponseSpeed } from '../domain/responseSpeed';
import { EMPTY_SESSION_METRICS, recordAnswer } from '../domain/sessionMetrics';
import { trueCountStorage } from '../storage/trueCountStorage';
import { SHOE_SIZES } from '../types';
import type {
  DeckPerformanceStats,
  TrueCountAnswerRecord,
  TrueCountSessionOptions,
  TrueCountSessionState,
  TrueCountSessionSummary,
  TrueCountSettings,
} from '../types';

interface TrueCountContextValue {
  settings: TrueCountSettings;
  isLoading: boolean;
  recentSessions: TrueCountSessionSummary[];
  performanceHistory: DeckPerformanceStats[];
  session: TrueCountSessionState | null;
  lastSummary: TrueCountSessionSummary | null;
  saveSettings: (settings: TrueCountSettings) => Promise<void>;
  startSession: (settings?: TrueCountSettings, options?: TrueCountSessionOptions) => void;
  submitAnswer: (answer: number) => void;
  nextQuestion: () => void;
  endSession: () => TrueCountSessionSummary | null;
  clearSession: () => void;
}

const TrueCountContext = createContext<TrueCountContextValue | undefined>(undefined);

function createSummary(session: TrueCountSessionState): TrueCountSessionSummary {
  const deckPerformance = aggregateAnswerRecords(session.answers);
  const weakestPatterns = rankWeakestPatterns(deckPerformance, WEAK_PATTERN_LIMIT);

  return {
    ...session.metrics,
    id: `${Date.now()}-${session.metrics.attempted}`,
    completedAt: new Date().toISOString(),
    shoeSize: session.settings.shoeSize,
    sessionLength: session.settings.sessionLength,
    mode: session.mode,
    deckPerformance,
    weakestPatterns,
    recommendation: createSessionRecommendation(deckPerformance),
    patternDecksRemaining: session.patternDecksRemaining,
  };
}

function generateSessionQuestion(
  settings: TrueCountSettings,
  options: TrueCountSessionOptions,
  performanceHistory: readonly DeckPerformanceStats[],
) {
  const questionSettings =
    options.mode === 'adaptive' && settings.shoeSize === 'mixed'
      ? { ...settings, shoeSize: SHOE_SIZES[Math.floor(Math.random() * SHOE_SIZES.length)] }
      : settings;
  const fixedDecksRemaining =
    options.mode === 'pattern-recall'
      ? options.patternDecksRemaining
      : options.mode === 'adaptive'
        ? chooseWeightedDeckValue(calculateAdaptiveWeights(questionSettings, performanceHistory))
        : undefined;
  const fixedRunningCount =
    options.mode === 'adaptive' && fixedDecksRemaining !== undefined
      ? chooseWeightedRunningCount(
          calculateAdaptiveRunningCountWeights(questionSettings, fixedDecksRemaining, performanceHistory),
        )
      : undefined;

  return generateTrueCountQuestion(questionSettings, Math.random, Date.now, { fixedDecksRemaining, fixedRunningCount });
}

export function TrueCountProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_TRUE_COUNT_SETTINGS);
  const [recentSessions, setRecentSessions] = useState<TrueCountSessionSummary[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<DeckPerformanceStats[]>([]);
  const [session, setSession] = useState<TrueCountSessionState | null>(null);
  const [lastSummary, setLastSummary] = useState<TrueCountSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<TrueCountSessionState | null>(null);
  const recentSessionsRef = useRef<TrueCountSessionSummary[]>([]);
  const performanceHistoryRef = useRef<DeckPerformanceStats[]>([]);

  useEffect(() => {
    let active = true;

    Promise.all([
      trueCountStorage.getSettings(),
      trueCountStorage.getRecentSessions(),
      trueCountStorage.getPerformanceHistory(),
    ])
      .then(([storedSettings, storedSessions, storedPerformance]) => {
        if (!active) return;
        setSettings(storedSettings);
        setRecentSessions(storedSessions);
        recentSessionsRef.current = storedSessions;
        setPerformanceHistory(storedPerformance);
        performanceHistoryRef.current = storedPerformance;
      })
      .catch(() => {
        // Storage can be unavailable (for example, restricted browser mode).
        // Defaults keep training usable even when preferences cannot persist.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveSettings = useCallback(async (nextSettings: TrueCountSettings) => {
    setSettings(nextSettings);
    try {
      await trueCountStorage.saveSettings(nextSettings);
    } catch {
      // Keep the in-memory preference so a storage failure never blocks a drill.
    }
  }, []);

  const startSession = useCallback(
    (sessionSettings = settings, options: TrueCountSessionOptions = { mode: 'standard' }) => {
      setLastSummary(null);
      const nextSession: TrueCountSessionState = {
        settings: sessionSettings,
        mode: options.mode,
        patternDecksRemaining: options.patternDecksRemaining,
        metrics: EMPTY_SESSION_METRICS,
        answers: [],
        currentQuestion: generateSessionQuestion(sessionSettings, options, performanceHistoryRef.current),
        questionStartedAt: Date.now(),
        feedback: null,
        hasReachedLimit: false,
      };
      sessionRef.current = nextSession;
      setSession(nextSession);
    },
    [settings],
  );

  const submitAnswer = useCallback((answer: number) => {
    const current = sessionRef.current;
    if (!current || current.feedback) return;

    const answeredAt = Date.now();
    const isCorrect = answer === current.currentQuestion.correctAnswer;
    const responseTimeMs = answeredAt - current.questionStartedAt;
    const responseSpeed = classifyResponseSpeed(responseTimeMs);
    const metrics = recordAnswer(current.metrics, isCorrect, responseTimeMs);
    const hasReachedLimit =
      current.settings.sessionLength !== 'endless' && metrics.attempted >= current.settings.sessionLength;
    const record: TrueCountAnswerRecord = {
      decksRemaining: current.currentQuestion.decksRemaining,
      runningCount: current.currentQuestion.runningCount,
      correctAnswer: current.currentQuestion.correctAnswer,
      answer,
      isCorrect,
      responseTimeMs,
      responseSpeed,
      answeredAt: new Date(answeredAt).toISOString(),
    };
    const nextSession: TrueCountSessionState = {
      ...current,
      metrics,
      answers: [...current.answers, record],
      feedback: {
        answer,
        correctAnswer: current.currentQuestion.correctAnswer,
        isCorrect,
        responseTimeMs,
        responseSpeed,
      },
      hasReachedLimit,
    };
    const updatedPerformance = updatePerformanceHistory(performanceHistoryRef.current, record);

    sessionRef.current = nextSession;
    setSession(nextSession);
    performanceHistoryRef.current = updatedPerformance;
    setPerformanceHistory(updatedPerformance);
    void trueCountStorage.savePerformanceHistory(updatedPerformance).catch(() => undefined);
  }, []);

  const nextQuestion = useCallback(() => {
    const current = sessionRef.current;
    if (!current || !current.feedback || current.hasReachedLimit) return;

    const nextSession: TrueCountSessionState = {
      ...current,
      currentQuestion: generateSessionQuestion(
        current.settings,
        { mode: current.mode, patternDecksRemaining: current.patternDecksRemaining },
        performanceHistoryRef.current,
      ),
      questionStartedAt: Date.now(),
      feedback: null,
    };
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  const endSession = useCallback(() => {
    const current = sessionRef.current;
    if (!current || current.metrics.attempted === 0) return null;

    const summary = createSummary(current);
    const updatedRecentSessions = [summary, ...recentSessionsRef.current].slice(0, RECENT_SESSION_LIMIT);

    setLastSummary(summary);
    recentSessionsRef.current = updatedRecentSessions;
    setRecentSessions(updatedRecentSessions);
    sessionRef.current = null;
    setSession(null);
    void trueCountStorage.saveRecentSessions(updatedRecentSessions).catch(() => undefined);

    return summary;
  }, []);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      recentSessions,
      performanceHistory,
      session,
      lastSummary,
      saveSettings,
      startSession,
      submitAnswer,
      nextQuestion,
      endSession,
      clearSession,
    }),
    [
      settings,
      isLoading,
      recentSessions,
      performanceHistory,
      session,
      lastSummary,
      saveSettings,
      startSession,
      submitAnswer,
      nextQuestion,
      endSession,
      clearSession,
    ],
  );

  return <TrueCountContext.Provider value={value}>{children}</TrueCountContext.Provider>;
}

export function useTrueCount() {
  const context = useContext(TrueCountContext);

  if (!context) {
    throw new Error('useTrueCount must be used inside a TrueCountProvider.');
  }

  return context;
}
