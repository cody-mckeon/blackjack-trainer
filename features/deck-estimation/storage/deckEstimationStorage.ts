import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_DECK_ESTIMATION_SETTINGS,
  RECENT_DECK_ESTIMATION_SESSION_LIMIT,
} from '../constants';
import { DECK_ESTIMATION_SHOE_SIZES } from '../types';
import type {
  DeckEstimateHistoryEntry,
  DeckEstimationSessionSummary,
  DeckEstimationSettings,
} from '../types';

const SETTINGS_KEY = '@blackjack-trainer/deck-estimation/settings/v1';
const RECENT_SESSIONS_KEY = '@blackjack-trainer/deck-estimation/recent-sessions/v1';
const PERFORMANCE_KEY = '@blackjack-trainer/deck-estimation/performance/v1';
const PERSONAL_BEST_KEY = '@blackjack-trainer/deck-estimation/personal-best/v1';

export interface DeckEstimationStorage {
  getSettings(): Promise<DeckEstimationSettings>;
  saveSettings(settings: DeckEstimationSettings): Promise<void>;
  getRecentSessions(): Promise<DeckEstimationSessionSummary[]>;
  saveRecentSessions(sessions: DeckEstimationSessionSummary[]): Promise<void>;
  getPerformanceHistory(): Promise<DeckEstimateHistoryEntry[]>;
  savePerformanceHistory(history: DeckEstimateHistoryEntry[]): Promise<void>;
  getFastestPerfectAverageMs(): Promise<number | null>;
  saveFastestPerfectAverageMs(value: number): Promise<void>;
}

export function parseDeckEstimationSettings(value: string | null): DeckEstimationSettings {
  if (!value) return DEFAULT_DECK_ESTIMATION_SETTINGS;
  try {
    const candidate = JSON.parse(value) as Partial<DeckEstimationSettings>;
    const shoeSize: DeckEstimationSettings['shoeSize'] =
      candidate.shoeSize === 'mixed' ||
      DECK_ESTIMATION_SHOE_SIZES.includes(candidate.shoeSize as (typeof DECK_ESTIMATION_SHOE_SIZES)[number])
        ? (candidate.shoeSize as DeckEstimationSettings['shoeSize'])
        : DEFAULT_DECK_ESTIMATION_SETTINGS.shoeSize;
    const precision =
      candidate.precision === 'whole' ||
      candidate.precision === 'half' ||
      candidate.precision === 'quarter' ||
      candidate.precision === 'mixed'
        ? candidate.precision
        : DEFAULT_DECK_ESTIMATION_SETTINGS.precision;
    const sessionLength =
      candidate.sessionLength === 10 ||
      candidate.sessionLength === 25 ||
      candidate.sessionLength === 50 ||
      candidate.sessionLength === 'endless'
        ? candidate.sessionLength
        : DEFAULT_DECK_ESTIMATION_SETTINGS.sessionLength;
    return { shoeSize, precision, sessionLength };
  } catch {
    return DEFAULT_DECK_ESTIMATION_SETTINGS;
  }
}

function parseArray<T>(value: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export const deckEstimationStorage: DeckEstimationStorage = {
  async getSettings() {
    return parseDeckEstimationSettings(await AsyncStorage.getItem(SETTINGS_KEY));
  },
  async saveSettings(settings) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
  async getRecentSessions() {
    return parseArray<DeckEstimationSessionSummary>(await AsyncStorage.getItem(RECENT_SESSIONS_KEY));
  },
  async saveRecentSessions(sessions) {
    await AsyncStorage.setItem(
      RECENT_SESSIONS_KEY,
      JSON.stringify(sessions.slice(0, RECENT_DECK_ESTIMATION_SESSION_LIMIT)),
    );
  },
  async getPerformanceHistory() {
    return parseArray<DeckEstimateHistoryEntry>(await AsyncStorage.getItem(PERFORMANCE_KEY));
  },
  async savePerformanceHistory(history) {
    await AsyncStorage.setItem(PERFORMANCE_KEY, JSON.stringify(history));
  },
  async getFastestPerfectAverageMs() {
    const stored = await AsyncStorage.getItem(PERSONAL_BEST_KEY);
    const parsed = stored === null ? NaN : Number(stored);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  },
  async saveFastestPerfectAverageMs(value) {
    await AsyncStorage.setItem(PERSONAL_BEST_KEY, String(Math.max(0, value)));
  },
};
