import type { StrategyInstruction } from '../types';

export type DealerValue = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'A';
export type StrategyRow = Record<DealerValue, StrategyInstruction>;

export interface StrategyTable {
  hard: Record<number, StrategyRow>;
  soft: Record<number, StrategyRow>;
  pairs: Record<number, StrategyRow>;
  surrender: {
    hard: Partial<Record<number, readonly DealerValue[]>>;
    pairs: Partial<Record<number, readonly DealerValue[]>>;
  };
}

export function row(values: readonly StrategyInstruction[]): StrategyRow {
  const dealerValues: DealerValue[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];
  return Object.fromEntries(dealerValues.map((dealer, index) => [dealer, values[index]])) as StrategyRow;
}
