import { promises as fs } from "fs";
import path from "path";
import type { SettlementRecord } from "./db-pg";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "settlements.json");

type SettlementStore = {
  byId: Record<string, SettlementRecord>;
  byUaTx: Record<string, string>;
};

const EMPTY: SettlementStore = { byId: {}, byUaTx: {} };

let writeQueue: Promise<void> = Promise.resolve();

async function readStore(): Promise<SettlementStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as SettlementStore;
    return {
      byId: parsed.byId ?? {},
      byUaTx: parsed.byUaTx ?? {},
    };
  } catch {
    return { ...EMPTY };
  }
}

async function writeStore(store: SettlementStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, STORE_PATH);
}

async function withStore<T>(fn: (store: SettlementStore) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  };
  const task = writeQueue.then(run, run);
  writeQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

async function withStoreRead<T>(fn: (store: SettlementStore) => T | Promise<T>): Promise<T> {
  return fn(await readStore());
}

export async function storeSaveSettlement(record: SettlementRecord): Promise<SettlementRecord> {
  return withStore((store) => {
    store.byId[record.id] = record;
    if (record.uaTransactionId) {
      store.byUaTx[record.uaTransactionId] = record.id;
    }
    return record;
  });
}

export async function storeGetSettlementById(id: string): Promise<SettlementRecord | null> {
  return withStoreRead((store) => store.byId[id] ?? null);
}

export async function storeGetSettlementByUaTx(
  uaTransactionId: string
): Promise<SettlementRecord | null> {
  return withStoreRead((store) => {
    const id = store.byUaTx[uaTransactionId];
    return id ? (store.byId[id] ?? null) : null;
  });
}

export async function storeMarkSettlementVerified(
  id: string,
  txHash?: string
): Promise<SettlementRecord | null> {
  return withStore((store) => {
    const record = store.byId[id];
    if (!record) return null;
    const verified: SettlementRecord = {
      ...record,
      status: "verified",
      txHash: txHash ?? record.txHash,
      verifiedAt: new Date().toISOString(),
    };
    store.byId[id] = verified;
    return verified;
  });
}