import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { ALL_HAND_PATTERNS, RECENT_BASIC_STRATEGY_SESSION_LIMIT, WEAKEST_HAND_LIMIT } from '../constants';
import { calculateAdaptiveDealerWeights, calculateAdaptivePatternWeights, chooseAdaptiveDealerValue, chooseAdaptivePattern } from '../domain/adaptiveWeighting';
import { generateBasicStrategyQuestion } from '../domain/handGenerator';
import {
  aggregateBasicStrategyRecords,
  aggregateCategoryPerformance,
  rankWeakestDealerUpcards,
  rankWeakestHands,
  updateBasicStrategyPerformance,
} from '../domain/performance';
import { createPatternRecallDealerOrder, generatePatternRecallQuestion } from '../domain/patternRecall';
import { createBasicStrategyRecommendations } from '../domain/recommendations';
import { classifyBasicStrategyResponseSpeed } from '../domain/responseSpeed';
import { EMPTY_BASIC_STRATEGY_METRICS, recordBasicStrategyAnswer } from '../domain/sessionMetrics';
import { getDealerValue } from '../domain/strategyLookup';
import { basicStrategyStorage } from '../storage/basicStrategyStorage';
import type {
  BasicStrategyAction,
  BasicStrategyAnswerRecord,
  BasicStrategyPerformanceStats,
  BasicStrategySessionOptions,
  BasicStrategySessionState,
  BasicStrategySessionSummary,
  BasicStrategySettings,
} from '../types';

interface BasicStrategyContextValue {
  settings: BasicStrategySettings;
  isLoading: boolean;
  session: BasicStrategySessionState | null;
  lastSummary: BasicStrategySessionSummary | null;
  recentSessions: BasicStrategySessionSummary[];
  performanceHistory: BasicStrategyPerformanceStats[];
  saveSettings: (settings: BasicStrategySettings) => Promise<void>;
  startSession: (options: BasicStrategySessionOptions, settings?: BasicStrategySettings) => void;
  submitAnswer: (action: BasicStrategyAction) => void;
  nextQuestion: () => void;
  endSession: () => BasicStrategySessionSummary | null;
  clearSession: () => void;
}

const BasicStrategyContext = createContext<BasicStrategyContextValue | undefined>(undefined);

function createQuestion(
  settings: BasicStrategySettings,
  options: BasicStrategySessionOptions,
  history: readonly BasicStrategyPerformanceStats[],
  recallDealerOrder?: readonly string[],
  recallIndex = 0,
) {
  if (options.mode === 'pattern-recall' && options.pattern && recallDealerOrder) {
    return generatePatternRecallQuestion(options.pattern, settings.rules, recallDealerOrder, recallIndex);
  }
  const pattern = options.mode === 'adaptive'
    ? chooseAdaptivePattern(calculateAdaptivePatternWeights(ALL_HAND_PATTERNS, settings.rules, history))
    : options.pattern;
  const dealerValue = options.mode === 'adaptive' && pattern
    ? chooseAdaptiveDealerValue(calculateAdaptiveDealerWeights(pattern, settings.rules, history))
    : undefined;
  return generateBasicStrategyQuestion({ rules: settings.rules, pattern, category: options.category, dealerValue });
}

function createSummary(session: BasicStrategySessionState): BasicStrategySessionSummary {
  const performance = aggregateBasicStrategyRecords(session.answers);
  const categoryPerformance = aggregateCategoryPerformance(session.answers);
  const weakestHands = rankWeakestHands(performance, WEAKEST_HAND_LIMIT);
  return {
    ...session.metrics,
    id: `${Date.now()}-${session.metrics.attempted}`,
    completedAt: new Date().toISOString(),
    rules: session.settings.rules,
    handTotalDisplay: session.settings.handTotalDisplay,
    sessionLength: session.settings.sessionLength,
    mode: session.mode,
    category: session.category,
    pattern: session.pattern,
    categoryPerformance,
    weakestHands,
    weakestDealerUpcards: rankWeakestDealerUpcards(performance, 3),
    recommendations: createBasicStrategyRecommendations(categoryPerformance, weakestHands),
  };
}

export function BasicStrategyProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<BasicStrategySettings>(() => ({ rules: 'H17', handTotalDisplay: 'after', cardSoundsEnabled: true, sessionLength: 25 }));
  const [session, setSession] = useState<BasicStrategySessionState | null>(null);
  const [lastSummary, setLastSummary] = useState<BasicStrategySessionSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<BasicStrategySessionSummary[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<BasicStrategyPerformanceStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const sessionRef = useRef<BasicStrategySessionState | null>(null);
  const historyRef = useRef<BasicStrategyPerformanceStats[]>([]);
  const sessionsRef = useRef<BasicStrategySessionSummary[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([basicStrategyStorage.getSettings(), basicStrategyStorage.getRecentSessions(), basicStrategyStorage.getPerformanceHistory()])
      .then(([storedSettings, storedSessions, storedHistory]) => {
        if (!active) return;
        setSettings(storedSettings);
        setRecentSessions(storedSessions);
        sessionsRef.current = storedSessions;
        setPerformanceHistory(storedHistory);
        historyRef.current = storedHistory;
      })
      .catch(() => undefined)
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const saveSettings = useCallback(async (next: BasicStrategySettings) => {
    setSettings(next);
    await basicStrategyStorage.saveSettings(next).catch(() => undefined);
  }, []);

  const startSession = useCallback((options: BasicStrategySessionOptions, sessionSettings = settings) => {
    const recallDealerOrder = options.mode === 'pattern-recall' ? createPatternRecallDealerOrder() : undefined;
    const next: BasicStrategySessionState = {
      settings: sessionSettings,
      mode: options.mode,
      category: options.category,
      pattern: options.pattern,
      recallDealerOrder,
      recallIndex: 0,
      metrics: EMPTY_BASIC_STRATEGY_METRICS,
      answers: [],
      currentQuestion: createQuestion(sessionSettings, options, historyRef.current, recallDealerOrder),
      questionStartedAt: Date.now(),
      feedback: null,
      hasReachedLimit: false,
    };
    setLastSummary(null);
    sessionRef.current = next;
    setSession(next);
  }, [settings]);

  const submitAnswer = useCallback((answer: BasicStrategyAction) => {
    const current = sessionRef.current;
    if (!current || current.feedback) return;
    const answeredAt = Date.now();
    const responseTimeMs = answeredAt - current.questionStartedAt;
    const isCorrect = answer === current.currentQuestion.correctAction;
    const responseSpeed = classifyBasicStrategyResponseSpeed(responseTimeMs);
    const metrics = recordBasicStrategyAnswer(current.metrics, isCorrect, responseTimeMs);
    const record: BasicStrategyAnswerRecord = {
      answer,
      correctAction: current.currentQuestion.correctAction,
      isCorrect,
      responseTimeMs,
      responseSpeed,
      rules: current.settings.rules,
      category: current.currentQuestion.category,
      patternLabel: current.currentQuestion.pattern.label,
      dealerUpcardValue: getDealerValue(current.currentQuestion.dealerUpcard),
      answeredAt: new Date(answeredAt).toISOString(),
    };
    const next = {
      ...current,
      metrics,
      answers: [...current.answers, record],
      feedback: { answer, correctAction: record.correctAction, isCorrect, responseTimeMs, responseSpeed },
      hasReachedLimit: current.settings.sessionLength !== 'endless' && metrics.attempted >= current.settings.sessionLength,
    };
    const updatedHistory = updateBasicStrategyPerformance(historyRef.current, record);
    sessionRef.current = next;
    setSession(next);
    historyRef.current = updatedHistory;
    setPerformanceHistory(updatedHistory);
    void basicStrategyStorage.savePerformanceHistory(updatedHistory).catch(() => undefined);
  }, []);

  const nextQuestion = useCallback(() => {
    const current = sessionRef.current;
    if (!current || !current.feedback || current.hasReachedLimit) return;
    const options = { mode: current.mode, category: current.category, pattern: current.pattern };
    const recallIndex = current.recallIndex + 1;
    const recallDealerOrder = current.mode === 'pattern-recall'
      && current.recallDealerOrder
      && recallIndex % current.recallDealerOrder.length === 0
      ? createPatternRecallDealerOrder()
      : current.recallDealerOrder;
    const next = {
      ...current,
      recallIndex,
      recallDealerOrder,
      currentQuestion: createQuestion(current.settings, options, historyRef.current, recallDealerOrder, recallIndex),
      questionStartedAt: Date.now(),
      feedback: null,
    };
    sessionRef.current = next;
    setSession(next);
  }, []);

  const endSession = useCallback(() => {
    const current = sessionRef.current;
    if (!current || current.metrics.attempted === 0) return null;
    const summary = createSummary(current);
    const sessions = [summary, ...sessionsRef.current].slice(0, RECENT_BASIC_STRATEGY_SESSION_LIMIT);
    setLastSummary(summary);
    sessionsRef.current = sessions;
    setRecentSessions(sessions);
    sessionRef.current = null;
    setSession(null);
    void basicStrategyStorage.saveRecentSessions(sessions).catch(() => undefined);
    return summary;
  }, []);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
  }, []);

  const value = useMemo(() => ({ settings, isLoading, session, lastSummary, recentSessions, performanceHistory, saveSettings, startSession, submitAnswer, nextQuestion, endSession, clearSession }), [settings, isLoading, session, lastSummary, recentSessions, performanceHistory, saveSettings, startSession, submitAnswer, nextQuestion, endSession, clearSession]);
  return <BasicStrategyContext.Provider value={value}>{children}</BasicStrategyContext.Provider>;
}

export function useBasicStrategy() {
  const context = useContext(BasicStrategyContext);
  if (!context) throw new Error('useBasicStrategy must be used within BasicStrategyProvider');
  return context;
}
