import { useCallback, useEffect, useRef } from 'react';
import { preload, useAudioPlayer } from 'expo-audio';

import { createCardDealSchedule } from '@/lib/audio/cardDealSequence';

const CARD_DEAL_SOUND = require('../assets/audio/card-deal.wav');
preload(CARD_DEAL_SOUND);

export function useCardSounds(enabled: boolean) {
  const player = useAudioPlayer(CARD_DEAL_SOUND);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearScheduledSounds = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearScheduledSounds, [clearScheduledSounds]);

  const playDealSequence = useCallback(
    (cardCount: number) => {
      clearScheduledSounds();

      timersRef.current = createCardDealSchedule(cardCount, enabled).map((delay) =>
        setTimeout(() => {
          void player
            .seekTo(0)
            .then(() => player.play())
            .catch(() => undefined);
        }, delay),
      );
    },
    [clearScheduledSounds, enabled, player],
  );

  return { playDealSequence, clearScheduledSounds };
}
