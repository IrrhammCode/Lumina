import { getChainConfig } from "./chain-config";

export type SettlementMode = "ua" | "magic" | "demo";

export function arbiscanTxUrl(txHash: string): string {
  return getChainConfig().explorerTxUrl(txHash);
}