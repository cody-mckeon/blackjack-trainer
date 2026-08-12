import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_TRUE_COUNT_SETTINGS, RECENT_SESSION_LIMIT } from '../constants';
import { SHOE_SIZES, type TrueCountSessionSummary, type TrueCountSettings } from '../types';

const SETTINGS_KEY = '@blackjack-trainer/true-count/settings/v1';
const RECENT_SESSIONS_KEY = '@blackjack-trainer/true-count/recent-sessions/v1';

export interface TrueCountStorage {
  getSettings(): Promise<TrueCountSettings>;
  saveSettings(settings: TrueCountSettings): Promise<void>;
  getRecentSessions(): Promise<TrueCountSessionSummary[]>;
  saveRecentSessions(sessions: TrueCountSessionSummary[]): Promise<void>;
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

    return {
      shoeSize: candidate.shoeSize,
      runningCountMin,
      runningCountMax,
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
      const sessions = JSON.parse(stored);
      return Array.isArray(sessions) ? (sessions as TrueCountSessionSummary[]) : [];
    } catch {
      return [];
    }
  },

  async saveRecentSessions(sessions) {
    await AsyncStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(sessions.slice(0, RECENT_SESSION_LIMIT)));
  },
};
