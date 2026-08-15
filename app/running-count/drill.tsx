import { Redirect, useLocalSearchParams } from 'expo-router';

import { CancellationDrill } from '@/features/running-count/components/modes/CancellationDrill';
import { CheckpointDrill } from '@/features/running-count/components/modes/CheckpointDrill';
import { CountdownDrill } from '@/features/running-count/components/modes/CountdownDrill';
import { EndlessStreamDrill } from '@/features/running-count/components/modes/EndlessStreamDrill';
import { HiddenCardDrill } from '@/features/running-count/components/modes/HiddenCardDrill';
import { SpeedDrill } from '@/features/running-count/components/modes/SpeedDrill';

export default function RunningCountDrillScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  if (mode === 'countdown') return <CountdownDrill />;
  if (mode === 'hidden-card') return <HiddenCardDrill />;
  if (mode === 'checkpoint') return <CheckpointDrill />;
  if (mode === 'speed') return <SpeedDrill />;
  if (mode === 'cancellation') return <CancellationDrill />;
  if (mode === 'endless') return <EndlessStreamDrill />;
  return <Redirect href="/running-count" />;
}
