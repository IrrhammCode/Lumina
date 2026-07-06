import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function usePostgres(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS lumina_users (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'wallet',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  portal_token TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  family JSONB NOT NULL DEFAULT '[]'::jsonb,
  requests JSONB NOT NULL DEFAULT '[]'::jsonb,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  payments JSONB NOT NULL DEFAULT '[]'::jsonb,
  seeded BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_lumina_users_portal_token ON lumina_users (portal_token) WHERE portal_token <> '';

CREATE TABLE IF NOT EXISTS lumina_wallet_challenges (
  address TEXT PRIMARY KEY,
  nonce TEXT NOT NULL,
  message TEXT NOT NULL,
  expires_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS lumina_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS lumina_settlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES lumina_users(id) ON DELETE CASCADE,
  ua_transaction_id TEXT,
  tx_hash TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  kind TEXT NOT NULL,
  request_id TEXT,
  rule_id TEXT,
  member_id TEXT,
  need_type TEXT,
  settlement_ref TEXT,
  explorer_url TEXT,
  settlement_mode TEXT NOT NULL DEFAULT 'ua',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lumina_settlements_ua_tx ON lumina_settlements (ua_transaction_id) WHERE ua_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lumina_settlements_tx_hash ON lumina_settlements (tx_hash) WHERE tx_hash IS NOT NULL;
`;

export async function ensureSchema(): Promise<void> {
  if (!usePostgres()) return;
  if (!schemaReady) {
    schemaReady = getPool().query(SCHEMA_SQL).then(() => undefined);
  }
  await schemaReady;
}

export async function pgQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function pgExec(text: string, params?: unknown[]): Promise<void> {
  await ensureSchema();
  await getPool().query(text, params);
}