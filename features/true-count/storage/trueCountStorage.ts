import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TRUE_COUNT_SETTINGS, RECENT_SESSION_LIMIT } from '../constants';
import { getTheoreticalRunningCountBound } from '../domain/runningCountBounds';
import {
  SHOE_SIZES,
  type DeckPerformanceStats,
  type TrueCountSessionSummary,
  type TrueCountSettings,
} from '../types';

const SETTINGS_KEY = '@blackjack-trainer/true-count/settings/v1';
const RECENT_SESSIONS_KEY = '@blackjack-trainer/true-count/recent-sessions/v1';
const PERFORMANCE_HISTORY_KEY = '@blackjack-trainer/true-count/performance/v1';

export interface TrueCountStorage {
  getSettings(): Promise<TrueCountSettings>;
  saveSettings(settings: TrueCountSettings): Promise<void>;
  getRecentSessions(): Promise<TrueCountSessionSummary[]>;
  saveRecentSessions(sessions: TrueCountSessionSummary[]): Promise<void>;
  getPerformanceHistory(): Promise<DeckPerformanceStats[]>;
  savePerformanceHistory(history: DeckPerformanceStats[]): Promise<void>;
}

function isShoeSelection(value: unknown): value is TrueCountSettings['shoeSize'] {
  return value === 'mixed' || SHOE_SIZES.includes(value as (typeof SHOE_SIZES)[number]);
}

function parseSettings(value: string | null): TrueCountSettings {
  if (!value) return DEFAULT_TRUE_COUNT_SETTINGS;

  try {
    const candidate = JSON.parse(value) as Partial<TrueCountSettings>;
    const runningCountMin = Number(candidate.runningCountMin);
    const runningCountMax = Number(candidate.runningCountMax);

    if (
      !isShoeSelection(candidate.shoeSize) ||
      !Number.isInteger(runningCountMin) ||
      !Number.isInteger(runningCountMax) ||
      runningCountMin > runningCountMax
    ) {
      return DEFAULT_TRUE_COUNT_SETTINGS;
    }

    const theoreticalBound = getTheoreticalRunningCountBound(candidate.shoeSize === 'mixed' ? 8 : candidate.shoeSize);
    const clampedMinimum = Math.min(theoreticalBound, Math.max(-theoreticalBound, runningCountMin));
    const clampedMaximum = Math.min(theoreticalBound, Math.max(-theoreticalBound, runningCountMax));

    return {
      shoeSize: candidate.shoeSize,
      runningCountRangeMode: candidate.runningCountRangeMode === 'custom' ? 'custom' : 'realistic',
      runningCountMin: clampedMinimum,
      runningCountMax: clampedMaximum,
      deckPrecision: candidate.deckPrecision === 0.25 || candidate.deckPrecision === 1 ? candidate.deckPrecision : 0.5,
      sessionLength:
        candidate.sessionLength === 10 ||
        candidate.sessionLength === 25 ||
        candidate.sessionLength === 50 ||
        candidate.sessionLength === 'endless'
          ? candidate.sessionLength
          : DEFAULT_TRUE_COUNT_SETTINGS.sessionLength,
    };
  } catch {
    return DEFAULT_TRUE_COUNT_SETTINGS;
  }
}

export const trueCountStorage: TrueCountStorage = {
  async getSettings() {
    return parseSettings(await AsyncStorage.getItem(SETTINGS_KEY));
  },

  async saveSettings(settings) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  async getRecentSessions() {
    const stored = await AsyncStorage.getItem(RECENT_SESSIONS_KEY);
    if (!stored) return [];

    try {
      const sessions = JSON.parse(stored) as Partial<TrueCountSessionSummary>[];
      if (!Array.isArray(sessions)) return [];

      return sessions.map((session) => ({
        ...(session as TrueCountSessionSummary),
        automaticAnswers: session.automaticAnswers ?? 0,
        automaticPercentage: session.automaticPercentage ?? 0,
        mode: session.mode ?? 'standard',
        deckPerformance: session.deckPerformance ?? [],
        weakestPatterns: session.weakestPatterns ?? [],
        recommendation: session.recommendation ?? 'Keep practicing to reveal your strongest patterns.',
      }));
    } catch {
      return [];
    }
  },

  async saveRecentSessions(sessions) {
    await AsyncStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(sessions.slice(0, RECENT_SESSION_LIMIT)));
  },

  async getPerformanceHistory() {
    const stored = await AsyncStorage.getItem(PERFORMANCE_HISTORY_KEY);
    if (!stored) return [];

    try {
      const history = JSON.parse(stored) as DeckPerformanceStats[];
      return Array.isArray(history)
        ? history.map((entry) => ({ ...entry, runningCounts: entry.runningCounts ?? {} }))
        : [];
    } catch {
      return [];
    }
  },

  async savePerformanceHistory(history) {
    await AsyncStorage.setItem(PERFORMANCE_HISTORY_KEY, JSON.stringify(history));
  },
};
