import { row, type StrategyTable } from './tableTypes';

const H = 'HIT';
const S = 'STAND';
const D = 'DOUBLE_OR_HIT';
const DS = 'DOUBLE_OR_STAND';
const P = 'SPLIT';
const PD = 'SPLIT_IF_DAS';
const N = 'NO_SPLIT';

/** Blackjack Apprenticeship H17 Basic Strategy, © 2024. Source documented in ../README.md. */
export const H17_STRATEGY_TABLE: StrategyTable = {
  hard: {
    8: row([H, H, H, H, H, H, H, H, H, H]),
    9: row([H, D, D, D, D, H, H, H, H, H]),
    10: row([D, D, D, D, D, D, D, D, H, H]),
    11: row([D, D, D, D, D, D, D, D, D, D]),
    12: row([H, H, S, S, S, H, H, H, H, H]),
    13: row([S, S, S, S, S, H, H, H, H, H]),
    14: row([S, S, S, S, S, H, H, H, H, H]),
    15: row([S, S, S, S, S, H, H, H, H, H]),
    16: row([S, S, S, S, S, H, H, H, H, H]),
    17: row([S, S, S, S, S, S, S, S, S, S]),
  },
  soft: {
    13: row([H, H, H, D, D, H, H, H, H, H]),
    14: row([H, H, H, D, D, H, H, H, H, H]),
    15: row([H, H, D, D, D, H, H, H, H, H]),
    16: row([H, H, D, D, D, H, H, H, H, H]),
    17: row([H, D, D, D, D, H, H, H, H, H]),
    18: row([DS, DS, DS, DS, DS, S, S, H, H, H]),
    19: row([S, S, S, S, DS, S, S, S, S, S]),
    20: row([S, S, S, S, S, S, S, S, S, S]),
  },
  pairs: {
    2: row([PD, PD, P, P, P, P, N, N, N, N]),
    3: row([PD, PD, P, P, P, P, N, N, N, N]),
    4: row([N, N, N, PD, PD, N, N, N, N, N]),
    5: row([N, N, N, N, N, N, N, N, N, N]),
    6: row([PD, P, P, P, P, N, N, N, N, N]),
    7: row([P, P, P, P, P, P, N, N, N, N]),
    8: row([P, P, P, P, P, P, P, P, P, P]),
    9: row([P, P, P, P, P, N, P, P, N, N]),
    10: row([N, N, N, N, N, N, N, N, N, N]),
    11: row([P, P, P, P, P, P, P, P, P, P]),
  },
  surrender: {
    hard: { 15: ['10', 'A'], 16: ['9', '10', 'A'], 17: ['A'] },
    pairs: { 8: ['A'] },
  },
};
