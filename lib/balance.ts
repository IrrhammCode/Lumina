const DEMO_BASE = 2450;

export function formatAvailableBalance(sentThisMonth: number): string {
  const remaining = Math.max(0, DEMO_BASE - sentThisMonth);
  return `$${remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatUnifiedBalance(
  totalUsd: number | null | undefined,
  sentThisMonth: number
): string {
  if (totalUsd != null && Number.isFinite(totalUsd)) {
    return `$${totalUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return formatAvailableBalance(sentThisMonth);
}