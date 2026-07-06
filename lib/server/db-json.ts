import { promises as fs } from "fs";
import path from "path";
import type { LuminaDatabase, UserRecord, WalletChallengeRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "lumina.json");

const EMPTY_DB: LuminaDatabase = {
  users: {},
  otps: {},
  emailToUserId: {},
  walletToUserId: {},
  walletChallenges: {},
  rateLimits: {},
};

let writeQueue: Promise<void> = Promise.resolve();

export function normalizeWallet(address: string): string {
  return address.trim().toLowerCase();
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readDb(): Promise<LuminaDatabase> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as LuminaDatabase;
    return {
      users: parsed.users ?? {},
      otps: parsed.otps ?? {},
      emailToUserId: parsed.emailToUserId ?? {},
      walletToUserId: parsed.walletToUserId ?? {},
      walletChallenges: parsed.walletChallenges ?? {},
      rateLimits: parsed.rateLimits ?? {},
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(db: LuminaDatabase): Promise<void> {
  await ensureDataDir();
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export async function withJsonDb<T>(fn: (db: LuminaDatabase) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const db = await readDb();
    const result = await fn(db);
    await writeDb(db);
    return result;
  };
  const task = writeQueue.then(run, run);
  writeQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

export async function withJsonDbRead<T>(fn: (db: LuminaDatabase) => T | Promise<T>): Promise<T> {
  const db = await readDb();
  return fn(db);
}

export async function jsonGetUserById(userId: string): Promise<UserRecord | null> {
  return withJsonDbRead((db) => db.users[userId] ?? null);
}

export async function jsonGetUserByWallet(address: string): Promise<UserRecord | null> {
  const key = normalizeWallet(address);
  return withJsonDbRead((db) => {
    const userId = db.walletToUserId[key];
    return userId ? (db.users[userId] ?? null) : null;
  });
}

export async function jsonGetUserByPortalToken(token: string): Promise<UserRecord | null> {
  return withJsonDbRead((db) => {
    const match = Object.values(db.users).find((u) => u.portalToken === token);
    return match ?? null;
  });
}

export async function jsonUpsertUser(user: UserRecord): Promise<UserRecord> {
  return withJsonDb((db) => {
    db.users[user.id] = user;
    if (user.walletAddress) {
      db.walletToUserId[normalizeWallet(user.walletAddress)] = user.id;
    }
    return user;
  });
}

export async function jsonUpdateUser(userId: string, patch: Partial<UserRecord>): Promise<UserRecord | null> {
  return withJsonDb((db) => {
    const user = db.users[userId];
    if (!user) return null;
    const next = { ...user, ...patch, id: user.id };
    db.users[userId] = next;
    if (next.walletAddress) {
      db.walletToUserId[normalizeWallet(next.walletAddress)] = userId;
    }
    return next;
  });
}

export async function jsonSaveWalletChallenge(
  address: string,
  nonce: string,
  message: string,
  ttlMs: number
): Promise<void> {
  const key = normalizeWallet(address);
  await withJsonDb((db) => {
    db.walletChallenges[key] = {
      address: key,
      nonce,
      message,
      expiresAt: Date.now() + ttlMs,
    };
  });
}

export async function jsonConsumeWalletChallenge(address: string): Promise<WalletChallengeRecord | null> {
  const key = normalizeWallet(address);
  return withJsonDb((db) => {
    const record = db.walletChallenges[key];
    if (!record) return null;
    delete db.walletChallenges[key];
    if (record.expiresAt < Date.now()) return null;
    return record;
  });
}

export async function jsonListAllUsers(): Promise<UserRecord[]> {
  return withJsonDbRead((db) => Object.values(db.users));
}

export async function jsonCheckRateLimit(
  bucket: string,
  max: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  return withJsonDb((db) => {
    const now = Date.now();
    const record = db.rateLimits[bucket];
    if (!record || record.resetAt < now) {
      db.rateLimits[bucket] = { count: 1, resetAt: now + windowMs };
      return { allowed: true };
    }
    if (record.count >= max) {
      return { allowed: false, retryAfterSec: Math.ceil((record.resetAt - now) / 1000) };
    }
    record.count += 1;
    return { allowed: true };
  });
}