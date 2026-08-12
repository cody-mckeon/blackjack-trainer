import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { DEFAULT_TRUE_COUNT_SETTINGS, RECENT_SESSION_LIMIT } from '../constants';
import { generateTrueCountQuestion } from '../domain/questionGenerator';
import { EMPTY_SESSION_METRICS, recordAnswer } from '../domain/sessionMetrics';
import { trueCountStorage } from '../storage/trueCountStorage';
import type { TrueCountSessionState, TrueCountSessionSummary, TrueCountSettings } from '../types';

interface TrueCountContextValue {
  settings: TrueCountSettings;
  isLoading: boolean;
  recentSessions: TrueCountSessionSummary[];
  session: TrueCountSessionState | null;
  lastSummary: TrueCountSessionSummary | null;
  saveSettings: (settings: TrueCountSettings) => Promise<void>;
  startSession: (settings?: TrueCountSettings) => void;
  submitAnswer: (answer: number) => void;
  nextQuestion: () => void;
  endSession: () => TrueCountSessionSummary | null;
  clearSession: () => void;
}

const TrueCountContext = createContext<TrueCountContextValue | undefined>(undefined);

function createSummary(session: TrueCountSessionState): TrueCountSessionSummary {
  return {
    ...session.metrics,
    id: `${Date.now()}-${session.metrics.attempted}`,
    completedAt: new Date().toISOString(),
    shoeSize: session.settings.shoeSize,
    sessionLength: session.settings.sessionLength,
  };
}

export function TrueCountProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_TRUE_COUNT_SETTINGS);
  const [recentSessions, setRecentSessions] = useState<TrueCountSessionSummary[]>([]);
  const [session, setSession] = useState<TrueCountSessionState | null>(null);
  const [lastSummary, setLastSummary] = useState<TrueCountSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([trueCountStorage.getSettings(), trueCountStorage.getRecentSessions()])
      .then(([storedSettings, storedSessions]) => {
        if (!active) return;
        setSettings(storedSettings);
        setRecentSessions(storedSessions);
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
    (sessionSettings = settings) => {
      setLastSummary(null);
      setSession({
        settings: sessionSettings,
        metrics: EMPTY_SESSION_METRICS,
        currentQuestion: generateTrueCountQuestion(sessionSettings),
        questionStartedAt: Date.now(),
        feedback: null,
        hasReachedLimit: false,
      });
    },
    [settings],
  );

  const submitAnswer = useCallback((answer: number) => {
    const answeredAt = Date.now();

    setSession((current) => {
      if (!current || current.feedback) return current;

      const isCorrect = answer === current.currentQuestion.correctAnswer;
      const responseTimeMs = answeredAt - current.questionStartedAt;
      const metrics = recordAnswer(current.metrics, isCorrect, responseTimeMs);
      const hasReachedLimit =
        current.settings.sessionLength !== 'endless' && metrics.attempted >= current.settings.sessionLength;

      return {
        ...current,
        metrics,
        feedback: {
          answer,
          correctAnswer: current.currentQuestion.correctAnswer,
          isCorrect,
          responseTimeMs,
        },
        hasReachedLimit,
      };
    });
  }, []);

  const nextQuestion = useCallback(() => {
    setSession((current) => {
      if (!current || !current.feedback || current.hasReachedLimit) return current;

      return {
        ...current,
        currentQuestion: generateTrueCountQuestion(current.settings),
        questionStartedAt: Date.now(),
        feedback: null,
      };
    });
  }, []);

  const endSession = useCallback(() => {
    if (!session || session.metrics.attempted === 0) return null;

    const summary = createSummary(session);
    const updatedRecentSessions = [summary, ...recentSessions].slice(0, RECENT_SESSION_LIMIT);

    setLastSummary(summary);
    setRecentSessions(updatedRecentSessions);
    setSession(null);
    void trueCountStorage.saveRecentSessions(updatedRecentSessions).catch(() => undefined);

    return summary;
  }, [recentSessions, session]);

  const clearSession = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({
      settings,
      isLoading,
      recentSessions,
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
