import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

const GLOBAL_CARD_SOUNDS_KEY = '@blackjack-trainer/preferences/card-sounds/v1';
const LEGACY_SETTINGS_KEYS = [
  '@blackjack-trainer/basic-strategy/settings/v1',
  '@blackjack-trainer/running-count/settings/v1',
] as const;

export function parseCardSoundsEnabled(value: string | null, fallback = true): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!value) return fallback;
  try {
    const candidate = JSON.parse(value) as { cardSoundsEnabled?: unknown };
    return typeof candidate.cardSoundsEnabled === 'boolean' ? candidate.cardSoundsEnabled : fallback;
  } catch {
    return fallback;
  }
}

async function loadPreference() {
  const globalValue = await AsyncStorage.getItem(GLOBAL_CARD_SOUNDS_KEY);
  if (globalValue !== null) return parseCardSoundsEnabled(globalValue);
  for (const key of LEGACY_SETTINGS_KEYS) {
    const legacyValue = await AsyncStorage.getItem(key);
    if (legacyValue !== null) return parseCardSoundsEnabled(legacyValue);
  }
  return true;
}

interface CardSoundPreferenceValue {
  cardSoundsEnabled: boolean;
  setCardSoundsEnabled: (enabled: boolean) => Promise<void>;
}

const CardSoundPreferenceContext = createContext<CardSoundPreferenceValue | undefined>(undefined);

export function CardSoundPreferenceProvider({ children }: PropsWithChildren) {
  const [cardSoundsEnabled, setValue] = useState<boolean | null>(null);
  useEffect(() => { void loadPreference().then(setValue).catch(() => setValue(true)); }, []);
  const setCardSoundsEnabled = useCallback(async (enabled: boolean) => {
    setValue(enabled);
    await AsyncStorage.setItem(GLOBAL_CARD_SOUNDS_KEY, String(enabled)).catch(() => undefined);
  }, []);
  const value = useMemo(() => ({ cardSoundsEnabled: cardSoundsEnabled ?? false, setCardSoundsEnabled }), [cardSoundsEnabled, setCardSoundsEnabled]);
  return <CardSoundPreferenceContext.Provider value={value}>{cardSoundsEnabled === null ? null : children}</CardSoundPreferenceContext.Provider>;
}

export function useCardSoundPreference() {
  const value = useContext(CardSoundPreferenceContext);
  if (!value) throw new Error('useCardSoundPreference must be used within CardSoundPreferenceProvider');
  return value;
}
