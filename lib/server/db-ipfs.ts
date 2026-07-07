import type { UserRecord, WalletChallengeRecord } from "./types";
import { buildGraphDocument } from "./graph-document";
import { fetchJson, listPins, type PinListItem, pinJson } from "./ipfs";
import * as json from "./db-json";

export { normalizeWallet } from "./db-json";

const GRAPH_META = { app: "lumina", type: "care-graph" } as const;

function normalizeWallet(address: string): string {
  return address.trim().toLowerCase();
}

function sortPinsNewest(pins: PinListItem[]): PinListItem[] {
  return [...pins].sort((a, b) => Date.parse(b.date_pinned) - Date.parse(a.date_pinned));
}

async function latestPinForWallet(wallet: string): Promise<PinListItem | null> {
  const pins = await listPins({ ...GRAPH_META, wallet }, 20);
  return sortPinsNewest(pins)[0] ?? null;
}

async function loadUserFromCid(cid: string): Promise<UserRecord | null> {
  const doc = await fetchJson<{ user?: UserRecord }>(cid);
  return doc?.user ?? null;
}

export async function ipfsGetUserByWallet(address: string): Promise<UserRecord | null> {
  const pin = await latestPinForWallet(normalizeWallet(address));
  if (!pin) return null;
  return loadUserFromCid(pin.ipfs_pin_hash);
}

export async function ipfsGetUserById(userId: string): Promise<UserRecord | null> {
  const pins = sortPinsNewest(await listPins({ ...GRAPH_META, userId }, 10));
  const pin = pins[0];
  if (!pin) return null;
  return loadUserFromCid(pin.ipfs_pin_hash);
}

export async function ipfsGetUserByPortalToken(token: string): Promise<UserRecord | null> {
  const pins = sortPinsNewest(await listPins({ ...GRAPH_META, portalToken: token }, 10));
  const pin = pins[0];
  if (!pin) return null;
  return loadUserFromCid(pin.ipfs_pin_hash);
}

export async function ipfsUpsertUser(user: UserRecord): Promise<UserRecord> {
  const wallet = normalizeWallet(user.walletAddress);
  const doc = buildGraphDocument(user);
  const cid = await pinJson(doc, `lumina-care-${wallet.slice(0, 10)}`, {
    ...GRAPH_META,
    wallet,
    userId: user.id,
    portalToken: user.portalToken || "none",
  });
  return { ...user, graphCid: cid };
}

export async function ipfsUpdateUser(
  userId: string,
  patch: Partial<UserRecord>
): Promise<UserRecord | null> {
  const existing = await ipfsGetUserById(userId);
  if (!existing) return null;
  const next = { ...existing, ...patch, id: existing.id };
  return ipfsUpsertUser(next);
}

export async function ipfsListAllUsers(): Promise<UserRecord[]> {
  const pins = await listPins({ ...GRAPH_META }, 100);
  const byWallet = new Map<string, PinListItem>();

  for (const pin of pins) {
    const wallet = String(pin.metadata?.keyvalues?.wallet ?? "");
    if (!wallet) continue;
    const prev = byWallet.get(wallet);
    if (!prev || Date.parse(pin.date_pinned) > Date.parse(prev.date_pinned)) {
      byWallet.set(wallet, pin);
    }
  }

  const users: UserRecord[] = [];
  for (const pin of byWallet.values()) {
    const user = await loadUserFromCid(pin.ipfs_pin_hash);
    if (user) users.push(user);
  }
  return users;
}

export async function ipfsSaveWalletChallenge(
  address: string,
  nonce: string,
  message: string,
  ttlMs: number
): Promise<void> {
  return json.jsonSaveWalletChallenge(address, nonce, message, ttlMs);
}

export async function ipfsConsumeWalletChallenge(
  address: string
): Promise<WalletChallengeRecord | null> {
  return json.jsonConsumeWalletChallenge(address);
}

export async function ipfsCheckRateLimit(
  bucket: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  return json.jsonCheckRateLimit(bucket, max, windowMs);
}