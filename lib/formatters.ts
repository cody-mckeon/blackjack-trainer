export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatResponseTime(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}
