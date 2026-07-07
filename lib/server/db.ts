import type { UserRecord, WalletChallengeRecord } from "./types";
import { getStorageMode, useIpfsStorage, usePostgresStorage } from "./storage-mode";
import * as json from "./db-json";
import * as ipfs from "./db-ipfs";
import * as pg from "./db-pg";
import * as store from "./settlement-store";

export { normalizeWallet } from "./db-json";
export type { SettlementRecord } from "./db-pg";

export function createUserId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createPortalToken(): string {
  return `pt_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createSettlementId(): string {
  return `stl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getActiveStorageLabel(): string {
  return getStorageMode();
}

export async function listAllUsers(): Promise<UserRecord[]> {
  if (useIpfsStorage()) return ipfs.ipfsListAllUsers();
  if (usePostgresStorage()) return pg.pgListAllUsers();
  return json.jsonListAllUsers();
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  if (useIpfsStorage()) return ipfs.ipfsGetUserById(userId);
  if (usePostgresStorage()) return pg.pgGetUserById(userId);
  return json.jsonGetUserById(userId);
}

export async function getUserByWallet(address: string): Promise<UserRecord | null> {
  if (useIpfsStorage()) return ipfs.ipfsGetUserByWallet(address);
  if (usePostgresStorage()) return pg.pgGetUserByWallet(address);
  return json.jsonGetUserByWallet(address);
}

export async function getUserByPortalToken(token: string): Promise<UserRecord | null> {
  if (useIpfsStorage()) return ipfs.ipfsGetUserByPortalToken(token);
  if (usePostgresStorage()) return pg.pgGetUserByPortalToken(token);
  return json.jsonGetUserByPortalToken(token);
}

export async function upsertUser(user: UserRecord): Promise<UserRecord> {
  if (useIpfsStorage()) return ipfs.ipfsUpsertUser(user);
  if (usePostgresStorage()) return pg.pgUpsertUser(user);
  return json.jsonUpsertUser(user);
}

export async function updateUser(
  userId: string,
  patch: Partial<UserRecord>
): Promise<UserRecord | null> {
  if (useIpfsStorage()) return ipfs.ipfsUpdateUser(userId, patch);
  if (usePostgresStorage()) return pg.pgUpdateUser(userId, patch);
  return json.jsonUpdateUser(userId, patch);
}

export async function saveWalletChallenge(
  address: string,
  nonce: string,
  message: string,
  ttlMs = 5 * 60 * 1000
): Promise<void> {
  if (useIpfsStorage()) return ipfs.ipfsSaveWalletChallenge(address, nonce, message, ttlMs);
  if (usePostgresStorage()) return pg.pgSaveWalletChallenge(address, nonce, message, ttlMs);
  return json.jsonSaveWalletChallenge(address, nonce, message, ttlMs);
}

export async function consumeWalletChallenge(address: string): Promise<WalletChallengeRecord | null> {
  if (useIpfsStorage()) return ipfs.ipfsConsumeWalletChallenge(address);
  if (usePostgresStorage()) return pg.pgConsumeWalletChallenge(address);
  return json.jsonConsumeWalletChallenge(address);
}

export async function checkRateLimit(
  bucket: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  if (useIpfsStorage()) return ipfs.ipfsCheckRateLimit(bucket, max, windowMs);
  if (usePostgresStorage()) return pg.pgCheckRateLimit(bucket, max, windowMs);
  return json.jsonCheckRateLimit(bucket, max, windowMs);
}

export async function createSettlement(
  input: Parameters<typeof pg.pgCreateSettlement>[0]
): Promise<pg.SettlementRecord> {
  if (usePostgresStorage()) {
    return pg.pgCreateSettlement(input);
  }
  const record: pg.SettlementRecord = {
    ...input,
    status: input.status ?? "pending",
    createdAt: new Date().toISOString(),
    verifiedAt: input.status === "verified" ? new Date().toISOString() : undefined,
  };
  return store.storeSaveSettlement(record);
}

export async function getSettlementById(id: string): Promise<pg.SettlementRecord | null> {
  if (usePostgresStorage()) return pg.pgGetSettlementById(id);
  return store.storeGetSettlementById(id);
}

export async function getSettlementByUaTx(uaTransactionId: string): Promise<pg.SettlementRecord | null> {
  if (usePostgresStorage()) return pg.pgGetSettlementByUaTx(uaTransactionId);
  return store.storeGetSettlementByUaTx(uaTransactionId);
}

export async function markSettlementVerified(
  id: string,
  txHash?: string
): Promise<pg.SettlementRecord | null> {
  if (usePostgresStorage()) return pg.pgMarkSettlementVerified(id, txHash);
  return store.storeMarkSettlementVerified(id, txHash);
}