import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_RUNNING_COUNT_SETTINGS, RECENT_RUNNING_COUNT_SESSION_LIMIT } from '../constants';
import type { RunningCountPersonalBest, RunningCountSessionSummary, RunningCountSettings } from '../types';
import { SUPPORTED_DECK_COUNTS, type DeckCount } from '@/lib/blackjack/shoe';

const SETTINGS_KEY = '@blackjack-trainer/running-count/settings/v1';
const SESSIONS_KEY = '@blackjack-trainer/running-count/recent-sessions/v1';
const PERSONAL_BESTS_KEY = '@blackjack-trainer/running-count/personal-bests/v1';

function isDeckCount(value: unknown): value is DeckCount {
  return SUPPORTED_DECK_COUNTS.includes(value as DeckCount);
}

export function parseRunningCountSettings(value: string | null): RunningCountSettings {
  if (!value) return DEFAULT_RUNNING_COUNT_SETTINGS;
  try {
    const candidate = JSON.parse(value) as Partial<RunningCountSettings>;
    return {
      deckCount: isDeckCount(candidate.deckCount) ? candidate.deckCount : DEFAULT_RUNNING_COUNT_SETTINGS.deckCount,
      cardSoundsEnabled: candidate.cardSoundsEnabled !== false,
      countdownDealStyle: candidate.countdownDealStyle === 'auto' ? 'auto' : 'manual',
      autoDealIntervalMs: [1500, 1000, 750, 500].includes(candidate.autoDealIntervalMs ?? 0)
        ? candidate.autoDealIntervalMs!
        : DEFAULT_RUNNING_COUNT_SETTINGS.autoDealIntervalMs,
      speedDealIntervalMs: [1500, 1250, 1000, 750, 600, 500].includes(candidate.speedDealIntervalMs ?? 0)
        ? candidate.speedDealIntervalMs!
        : DEFAULT_RUNNING_COUNT_SETTINGS.speedDealIntervalMs,
      checkpointFrequency: candidate.checkpointFrequency === 5 || candidate.checkpointFrequency === 10
        || candidate.checkpointFrequency === 20 || candidate.checkpointFrequency === 'random'
        ? candidate.checkpointFrequency
        : DEFAULT_RUNNING_COUNT_SETTINGS.checkpointFrequency,
      cancellationChunkSize: candidate.cancellationChunkSize === 3 ? 3 : 2,
      endlessDurationSeconds: candidate.endlessDurationSeconds === 120 || candidate.endlessDurationSeconds === 'endless'
        ? candidate.endlessDurationSeconds
        : 60,
    };
  } catch {
    return DEFAULT_RUNNING_COUNT_SETTINGS;
  }
}

async function readArray<T>(key: string): Promise<T[]> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return [];
  try {
    const result = JSON.parse(value);
    return Array.isArray(result) ? result as T[] : [];
  } catch {
    return [];
  }
}

export interface RunningCountStorage {
  getSettings(): Promise<RunningCountSettings>;
  saveSettings(settings: RunningCountSettings): Promise<void>;
  getRecentSessions(): Promise<RunningCountSessionSummary[]>;
  saveRecentSessions(sessions: readonly RunningCountSessionSummary[]): Promise<void>;
  getPersonalBests(): Promise<RunningCountPersonalBest[]>;
  savePersonalBests(records: readonly RunningCountPersonalBest[]): Promise<void>;
}

export const runningCountStorage: RunningCountStorage = {
  async getSettings() { return parseRunningCountSettings(await AsyncStorage.getItem(SETTINGS_KEY)); },
  async saveSettings(settings) { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); },
  async getRecentSessions() { return readArray<RunningCountSessionSummary>(SESSIONS_KEY); },
  async saveRecentSessions(sessions) {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(0, RECENT_RUNNING_COUNT_SESSION_LIMIT)));
  },
  async getPersonalBests() { return readArray<RunningCountPersonalBest>(PERSONAL_BESTS_KEY); },
  async savePersonalBests(records) { await AsyncStorage.setItem(PERSONAL_BESTS_KEY, JSON.stringify(records)); },
};
