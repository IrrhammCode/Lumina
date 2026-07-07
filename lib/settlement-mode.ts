export type SettlementMode = "ua" | "magic" | "demo";

export function arbiscanTxUrl(txHash: string): string {
  return `https://arbiscan.io/tx/${txHash}`;
}