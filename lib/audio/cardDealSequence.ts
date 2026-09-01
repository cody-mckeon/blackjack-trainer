export const CARD_DEAL_INTERVAL_MS = 90;

export function createCardDealSchedule(
  cardCount: number,
  enabled: boolean,
  intervalMs = CARD_DEAL_INTERVAL_MS,
): number[] {
  if (!enabled || !Number.isInteger(cardCount) || cardCount <= 0) return [];
  return Array.from({ length: cardCount }, (_, index) => index * intervalMs);
}
