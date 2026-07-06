import type { UserRecord, WalletChallengeRecord } from "./types";
import { usePostgres } from "./pg";
import * as json from "./db-json";
import * as pg from "./db-pg";

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

export async function listAllUsers(): Promise<UserRecord[]> {
  return usePostgres() ? pg.pgListAllUsers() : json.jsonListAllUsers();
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  return usePostgres() ? pg.pgGetUserById(userId) : json.jsonGetUserById(userId);
}

export async function getUserByWallet(address: string): Promise<UserRecord | null> {
  return usePostgres() ? pg.pgGetUserByWallet(address) : json.jsonGetUserByWallet(address);
}

export async function getUserByPortalToken(token: string): Promise<UserRecord | null> {
  return usePostgres() ? pg.pgGetUserByPortalToken(token) : json.jsonGetUserByPortalToken(token);
}

export async function upsertUser(user: UserRecord): Promise<UserRecord> {
  return usePostgres() ? pg.pgUpsertUser(user) : json.jsonUpsertUser(user);
}

export async function updateUser(
  userId: string,
  patch: Partial<UserRecord>
): Promise<UserRecord | null> {
  return usePostgres() ? pg.pgUpdateUser(userId, patch) : json.jsonUpdateUser(userId, patch);
}

export async function saveWalletChallenge(
  address: string,
  nonce: string,
  message: string,
  ttlMs = 5 * 60 * 1000
): Promise<void> {
  return usePostgres()
    ? pg.pgSaveWalletChallenge(address, nonce, message, ttlMs)
    : json.jsonSaveWalletChallenge(address, nonce, message, ttlMs);
}

export async function consumeWalletChallenge(address: string): Promise<WalletChallengeRecord | null> {
  return usePostgres()
    ? pg.pgConsumeWalletChallenge(address)
    : json.jsonConsumeWalletChallenge(address);
}

export async function checkRateLimit(
  bucket: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  return usePostgres()
    ? pg.pgCheckRateLimit(bucket, max, windowMs)
    : json.jsonCheckRateLimit(bucket, max, windowMs);
}

export async function createSettlement(
  input: Parameters<typeof pg.pgCreateSettlement>[0]
): Promise<pg.SettlementRecord> {
  if (!usePostgres()) {
    throw new Error("Settlements require DATABASE_URL (PostgreSQL)");
  }
  return pg.pgCreateSettlement(input);
}

export async function getSettlementById(id: string): Promise<pg.SettlementRecord | null> {
  if (!usePostgres()) return null;
  return pg.pgGetSettlementById(id);
}

export async function getSettlementByUaTx(uaTransactionId: string): Promise<pg.SettlementRecord | null> {
  if (!usePostgres()) return null;
  return pg.pgGetSettlementByUaTx(uaTransactionId);
}

export async function markSettlementVerified(
  id: string,
  txHash?: string
): Promise<pg.SettlementRecord | null> {
  if (!usePostgres()) return null;
  return pg.pgMarkSettlementVerified(id, txHash);
}