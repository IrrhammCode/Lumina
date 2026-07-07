import type { UserRecord, WalletChallengeRecord } from "./types";
import { normalizeWallet } from "./db-json";
import { pgExec, pgQuery } from "./pg";

type UserRow = {
  id: string;
  wallet_address: string;
  email: string;
  provider: UserRecord["provider"];
  onboarded: boolean;
  portal_token: string;
  created_at: Date | string;
  prefs: UserRecord["prefs"];
  family: UserRecord["family"];
  requests: UserRecord["requests"];
  rules: UserRecord["rules"];
  payments: UserRecord["payments"];
  seeded: boolean;
};

export type SettlementRecord = {
  id: string;
  userId: string;
  uaTransactionId?: string;
  txHash?: string;
  amount: number;
  status: "pending" | "verified" | "failed";
  kind: "pull" | "manual" | "auto";
  requestId?: string;
  ruleId?: string;
  memberId?: string;
  needType?: string;
  settlementRef?: string;
  explorerUrl?: string;
  settlementMode: "ua" | "demo" | "magic";
  verifiedAt?: string;
  createdAt: string;
};

function rowToUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    walletAddress: row.wallet_address,
    email: row.email,
    provider: row.provider,
    onboarded: row.onboarded,
    portalToken: row.portal_token,
    createdAt: new Date(row.created_at).toISOString(),
    prefs: row.prefs,
    family: row.family,
    requests: row.requests,
    rules: row.rules,
    payments: row.payments,
    seeded: row.seeded,
  };
}

export async function pgListAllUsers(): Promise<UserRecord[]> {
  const rows = await pgQuery<UserRow>(`SELECT * FROM lumina_users`);
  return rows.map(rowToUser);
}

export async function pgGetUserById(userId: string): Promise<UserRecord | null> {
  const rows = await pgQuery<UserRow>(`SELECT * FROM lumina_users WHERE id = $1`, [userId]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function pgGetUserByWallet(address: string): Promise<UserRecord | null> {
  const rows = await pgQuery<UserRow>(`SELECT * FROM lumina_users WHERE wallet_address = $1`, [
    normalizeWallet(address),
  ]);
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function pgGetUserByPortalToken(token: string): Promise<UserRecord | null> {
  const rows = await pgQuery<UserRow>(
    `SELECT * FROM lumina_users WHERE portal_token = $1 AND portal_token <> ''`,
    [token]
  );
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function pgUpsertUser(user: UserRecord): Promise<UserRecord> {
  await pgExec(
    `INSERT INTO lumina_users (
      id, wallet_address, email, provider, onboarded, portal_token, created_at,
      prefs, family, requests, rules, payments, seeded
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (id) DO UPDATE SET
      wallet_address = EXCLUDED.wallet_address,
      email = EXCLUDED.email,
      provider = EXCLUDED.provider,
      onboarded = EXCLUDED.onboarded,
      portal_token = EXCLUDED.portal_token,
      prefs = EXCLUDED.prefs,
      family = EXCLUDED.family,
      requests = EXCLUDED.requests,
      rules = EXCLUDED.rules,
      payments = EXCLUDED.payments,
      seeded = EXCLUDED.seeded`,
    [
      user.id,
      normalizeWallet(user.walletAddress),
      user.email,
      user.provider,
      user.onboarded,
      user.portalToken,
      user.createdAt,
      JSON.stringify(user.prefs),
      JSON.stringify(user.family),
      JSON.stringify(user.requests),
      JSON.stringify(user.rules),
      JSON.stringify(user.payments),
      user.seeded,
    ]
  );
  return user;
}

export async function pgUpdateUser(userId: string, patch: Partial<UserRecord>): Promise<UserRecord | null> {
  const current = await pgGetUserById(userId);
  if (!current) return null;
  const next = { ...current, ...patch, id: current.id };
  await pgUpsertUser(next);
  return next;
}

export async function pgSaveWalletChallenge(
  address: string,
  nonce: string,
  message: string,
  ttlMs: number
): Promise<void> {
  await pgExec(
    `INSERT INTO lumina_wallet_challenges (address, nonce, message, expires_at)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (address) DO UPDATE SET nonce = $2, message = $3, expires_at = $4`,
    [normalizeWallet(address), nonce, message, Date.now() + ttlMs]
  );
}

export async function pgConsumeWalletChallenge(address: string): Promise<WalletChallengeRecord | null> {
  const rows = await pgQuery<{ address: string; nonce: string; message: string; expires_at: string }>(
    `DELETE FROM lumina_wallet_challenges WHERE address = $1 RETURNING address, nonce, message, expires_at`,
    [normalizeWallet(address)]
  );
  const row = rows[0];
  if (!row || Number(row.expires_at) < Date.now()) return null;
  return {
    address: row.address,
    nonce: row.nonce,
    message: row.message,
    expiresAt: Number(row.expires_at),
  };
}

export async function pgCheckRateLimit(
  bucket: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  const now = Date.now();
  const rows = await pgQuery<{ count: number; reset_at: string }>(
    `SELECT count, reset_at FROM lumina_rate_limits WHERE bucket = $1`,
    [bucket]
  );
  const record = rows[0];
  if (!record || Number(record.reset_at) < now) {
    await pgExec(
      `INSERT INTO lumina_rate_limits (bucket, count, reset_at) VALUES ($1, 1, $2)
       ON CONFLICT (bucket) DO UPDATE SET count = 1, reset_at = $2`,
      [bucket, now + windowMs]
    );
    return { allowed: true };
  }
  if (record.count >= max) {
    return { allowed: false, retryAfterSec: Math.ceil((Number(record.reset_at) - now) / 1000) };
  }
  await pgExec(`UPDATE lumina_rate_limits SET count = count + 1 WHERE bucket = $1`, [bucket]);
  return { allowed: true };
}

type SettlementRow = {
  id: string;
  user_id: string;
  ua_transaction_id: string | null;
  tx_hash: string | null;
  amount: string;
  status: SettlementRecord["status"];
  kind: SettlementRecord["kind"];
  request_id: string | null;
  rule_id: string | null;
  member_id: string | null;
  need_type: string | null;
  settlement_ref: string | null;
  explorer_url: string | null;
  settlement_mode: SettlementRecord["settlementMode"];
  verified_at: Date | string | null;
  created_at: Date | string;
};

function rowToSettlement(row: SettlementRow): SettlementRecord {
  return {
    id: row.id,
    userId: row.user_id,
    uaTransactionId: row.ua_transaction_id ?? undefined,
    txHash: row.tx_hash ?? undefined,
    amount: Number(row.amount),
    status: row.status,
    kind: row.kind,
    requestId: row.request_id ?? undefined,
    ruleId: row.rule_id ?? undefined,
    memberId: row.member_id ?? undefined,
    needType: row.need_type ?? undefined,
    settlementRef: row.settlement_ref ?? undefined,
    explorerUrl: row.explorer_url ?? undefined,
    settlementMode: row.settlement_mode,
    verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function pgCreateSettlement(input: Omit<SettlementRecord, "verifiedAt" | "createdAt" | "status"> & { status?: SettlementRecord["status"] }): Promise<SettlementRecord> {
  const status = input.status ?? "pending";
  await pgExec(
    `INSERT INTO lumina_settlements (
      id, user_id, ua_transaction_id, tx_hash, amount, status, kind,
      request_id, rule_id, member_id, need_type, settlement_ref, explorer_url, settlement_mode, verified_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      input.id,
      input.userId,
      input.uaTransactionId ?? null,
      input.txHash ?? null,
      input.amount,
      status,
      input.kind,
      input.requestId ?? null,
      input.ruleId ?? null,
      input.memberId ?? null,
      input.needType ?? null,
      input.settlementRef ?? null,
      input.explorerUrl ?? null,
      input.settlementMode,
      status === "verified" ? new Date().toISOString() : null,
    ]
  );
  const rows = await pgQuery<SettlementRow>(`SELECT * FROM lumina_settlements WHERE id = $1`, [input.id]);
  return rowToSettlement(rows[0]);
}

export async function pgGetSettlementById(id: string): Promise<SettlementRecord | null> {
  const rows = await pgQuery<SettlementRow>(`SELECT * FROM lumina_settlements WHERE id = $1`, [id]);
  return rows[0] ? rowToSettlement(rows[0]) : null;
}

export async function pgGetSettlementByUaTx(uaTransactionId: string): Promise<SettlementRecord | null> {
  const rows = await pgQuery<SettlementRow>(
    `SELECT * FROM lumina_settlements WHERE ua_transaction_id = $1`,
    [uaTransactionId]
  );
  return rows[0] ? rowToSettlement(rows[0]) : null;
}

export async function pgMarkSettlementVerified(id: string, txHash?: string): Promise<SettlementRecord | null> {
  await pgExec(
    `UPDATE lumina_settlements SET status = 'verified', verified_at = NOW(), tx_hash = COALESCE($2, tx_hash) WHERE id = $1`,
    [id, txHash ?? null]
  );
  return pgGetSettlementById(id);
}