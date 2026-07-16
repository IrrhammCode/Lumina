import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { join } from "path";
import { createHmac, timingSafeEqual } from "crypto";
import { fetchJson, isIpfsConfigured, listPins, pinJson } from "./ipfs";

type PkceRecord = { payload: string; exp: number };

const TTL_MS = 10 * 60 * 1000;
const TMP_DIR = join("/tmp", "lumina-oauth-pkce");

type GlobalPkce = typeof globalThis & {
  __luminaOauthPkce?: Map<string, PkceRecord>;
};

function store(): Map<string, PkceRecord> {
  const g = globalThis as GlobalPkce;
  if (!g.__luminaOauthPkce) g.__luminaOauthPkce = new Map();
  return g.__luminaOauthPkce;
}

function safeStateKey(state: string): string {
  const secret = process.env.JWT_SECRET ?? "lumina-dev-secret-change-in-production";
  return createHmac("sha256", secret).update(state).digest("hex").slice(0, 32);
}

function tmpPath(key: string): string {
  return join(TMP_DIR, `${key}.json`);
}

function isFresh(record: PkceRecord, now = Date.now()): boolean {
  return Boolean(record?.payload) && record.exp >= now;
}

export async function saveOAuthPkce(state: string, payload: string): Promise<void> {
  if (!state || !payload) return;
  const key = safeStateKey(state);
  const record: PkceRecord = { payload, exp: Date.now() + TTL_MS };
  store().set(key, record);

  try {
    await mkdir(TMP_DIR, { recursive: true });
    await writeFile(tmpPath(key), JSON.stringify(record), "utf8");
  } catch {
    /* /tmp may be unavailable */
  }

  // Durable across Vercel isolates when Pinata is configured.
  if (isIpfsConfigured()) {
    try {
      await pinJson(record, `lumina-oauth-pkce-${key}`, {
        type: "oauth-pkce",
        pkceKey: key,
      });
    } catch (err) {
      console.warn("oauth pkce pin failed:", err);
    }
  }
}

export async function loadOAuthPkce(state: string): Promise<string | null> {
  if (!state) return null;
  const key = safeStateKey(state);
  const now = Date.now();

  const mem = store().get(key);
  if (mem) {
    if (!isFresh(mem, now)) store().delete(key);
    else return mem.payload;
  }

  try {
    const raw = await readFile(tmpPath(key), "utf8");
    const record = JSON.parse(raw) as PkceRecord;
    if (!isFresh(record, now)) {
      await unlink(tmpPath(key)).catch(() => undefined);
    } else {
      store().set(key, record);
      return record.payload;
    }
  } catch {
    /* continue */
  }

  if (isIpfsConfigured()) {
    try {
      const pins = await listPins({ type: "oauth-pkce", pkceKey: key }, 10);
      const newest = [...pins].sort(
        (a, b) => Date.parse(b.date_pinned) - Date.parse(a.date_pinned)
      )[0];
      if (newest?.ipfs_pin_hash) {
        const record = await fetchJson<PkceRecord>(newest.ipfs_pin_hash);
        if (record && isFresh(record, now)) {
          store().set(key, record);
          return record.payload;
        }
      }
    } catch (err) {
      console.warn("oauth pkce pin load failed:", err);
    }
  }

  return null;
}

export async function clearOAuthPkce(state: string): Promise<void> {
  if (!state) return;
  const key = safeStateKey(state);
  store().delete(key);
  try {
    await unlink(tmpPath(key));
  } catch {
    /* ignore */
  }
}

export function statesMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
