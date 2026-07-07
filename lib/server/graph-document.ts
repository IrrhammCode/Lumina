import type { UserRecord } from "./types";

export const CARE_GRAPH_VERSION = 1 as const;

export type CareGraphDocument = {
  version: typeof CARE_GRAPH_VERSION;
  wallet: string;
  updatedAt: string;
  cid?: string;
  user: UserRecord;
};

export function buildGraphDocument(user: UserRecord, cid?: string): CareGraphDocument {
  return {
    version: CARE_GRAPH_VERSION,
    wallet: user.walletAddress,
    updatedAt: new Date().toISOString(),
    cid,
    user,
  };
}