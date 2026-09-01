import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';

import { DEFAULT_RUNNING_COUNT_SETTINGS, RECENT_RUNNING_COUNT_SESSION_LIMIT } from '../constants';
import { updatePersonalBestCollection } from '../domain/personalBests';
import { runningCountStorage } from '../storage/runningCountStorage';
import type { RunningCountPersonalBest, RunningCountSessionSummary, RunningCountSettings } from '../types';

interface RunningCountContextValue {
  settings: RunningCountSettings;
  isLoading: boolean;
  recentSessions: RunningCountSessionSummary[];
  personalBests: RunningCountPersonalBest[];
  lastSummary: RunningCountSessionSummary | null;
  saveSettings: (settings: RunningCountSettings) => Promise<void>;
  completeSession: (summary: RunningCountSessionSummary) => void;
}

const RunningCountContext = createContext<RunningCountContextValue | undefined>(undefined);

export function RunningCountProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState(DEFAULT_RUNNING_COUNT_SETTINGS);
  const [recentSessions, setRecentSessions] = useState<RunningCountSessionSummary[]>([]);
  const [personalBests, setPersonalBests] = useState<RunningCountPersonalBest[]>([]);
  const [lastSummary, setLastSummary] = useState<RunningCountSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionsRef = useRef<RunningCountSessionSummary[]>([]);
  const bestsRef = useRef<RunningCountPersonalBest[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      runningCountStorage.getSettings(),
      runningCountStorage.getRecentSessions(),
      runningCountStorage.getPersonalBests(),
    ]).then(([storedSettings, sessions, bests]) => {
      if (!active) return;
      setSettings(storedSettings);
      setRecentSessions(sessions);
      setPersonalBests(bests);
      sessionsRef.current = sessions;
      bestsRef.current = bests;
    }).catch(() => undefined).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const saveSettings = useCallback(async (next: RunningCountSettings) => {
    setSettings(next);
    await runningCountStorage.saveSettings(next).catch(() => undefined);
  }, []);

  const completeSession = useCallback((summary: RunningCountSessionSummary) => {
    const sessions = [summary, ...sessionsRef.current].slice(0, RECENT_RUNNING_COUNT_SESSION_LIMIT);
    const bests = updatePersonalBestCollection(bestsRef.current, summary);
    sessionsRef.current = sessions;
    bestsRef.current = bests;
    setLastSummary(summary);
    setRecentSessions(sessions);
    setPersonalBests(bests);
    void Promise.all([
      runningCountStorage.saveRecentSessions(sessions),
      runningCountStorage.savePersonalBests(bests),
    ]).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({
    settings, isLoading, recentSessions, personalBests, lastSummary, saveSettings, completeSession,
  }), [settings, isLoading, recentSessions, personalBests, lastSummary, saveSettings, completeSession]);

  return <RunningCountContext.Provider value={value}>{children}</RunningCountContext.Provider>;
}

export function useRunningCount() {
  const value = useContext(RunningCountContext);
  if (!value) throw new Error('useRunningCount must be used within RunningCountProvider');
  return value;
}
