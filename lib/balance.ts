/** Format on-chain USDT balance from Magic or Universal Account. */
export function formatUnifiedBalance(totalUsd: number | null | undefined): string {
  if (totalUsd != null && Number.isFinite(totalUsd)) {
    return `$${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return "$0.00";
}

/** @deprecated Use formatUnifiedBalance — kept for call sites passing sentThisMonth */
export function formatAvailableBalance(_sentThisMonth: number): string {
  return "$0.00";
}