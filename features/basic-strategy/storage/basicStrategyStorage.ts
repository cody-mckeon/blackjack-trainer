import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_BASIC_STRATEGY_SETTINGS, RECENT_BASIC_STRATEGY_SESSION_LIMIT } from '../constants';
import type {
  BasicStrategyPerformanceStats,
  BasicStrategySessionSummary,
  BasicStrategySettings,
} from '../types';

const SETTINGS_KEY = '@blackjack-trainer/basic-strategy/settings/v1';
const SESSIONS_KEY = '@blackjack-trainer/basic-strategy/recent-sessions/v1';
const PERFORMANCE_KEY = '@blackjack-trainer/basic-strategy/performance/v1';

export function parseBasicStrategySettings(value: string | null): BasicStrategySettings {
  if (!value) return DEFAULT_BASIC_STRATEGY_SETTINGS;
  try {
    const candidate = JSON.parse(value) as Partial<BasicStrategySettings>;
    return {
      rules: candidate.rules === 'S17' ? 'S17' : 'H17',
      handTotalDisplay: candidate.handTotalDisplay === 'before' || candidate.handTotalDisplay === 'hidden'
        ? candidate.handTotalDisplay
        : 'after',
      cardSoundsEnabled: candidate.cardSoundsEnabled !== false,
      sessionLength: candidate.sessionLength === 10 || candidate.sessionLength === 50 || candidate.sessionLength === 'endless'
        ? candidate.sessionLength
        : 25,
    };
  } catch {
    return DEFAULT_BASIC_STRATEGY_SETTINGS;
  }
}

async function readArray<T>(key: string): Promise<T[]> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

export const basicStrategyStorage = {
  async getSettings() {
    return parseBasicStrategySettings(await AsyncStorage.getItem(SETTINGS_KEY));
  },
  async saveSettings(settings: BasicStrategySettings) {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
  async getRecentSessions() {
    return readArray<BasicStrategySessionSummary>(SESSIONS_KEY);
  },
  async saveRecentSessions(sessions: readonly BasicStrategySessionSummary[]) {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, RECENT_BASIC_STRATEGY_SESSION_LIMIT)));
  },
  async getPerformanceHistory() {
    return readArray<BasicStrategyPerformanceStats>(PERFORMANCE_KEY);
  },
  async savePerformanceHistory(history: readonly BasicStrategyPerformanceStats[]) {
    await AsyncStorage.setItem(PERFORMANCE_KEY, JSON.stringify(history));
  },
};
