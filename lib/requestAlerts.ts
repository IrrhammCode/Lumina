import { getPrefs } from "./prefs";
import { getPendingRequests, type CareRequest } from "./requests";

const SEEN_KEY = "lumina_seen_requests";
const INIT_KEY = "lumina_alerts_init";

function getSeenIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
}

export function ensureAlertsInitialized(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(INIT_KEY)) return;
  saveSeenIds(new Set(getPendingRequests().map((r) => r.id)));
  localStorage.setItem(INIT_KEY, "1");
}

export function markRequestSeen(id: string): void {
  const seen = getSeenIds();
  seen.add(id);
  saveSeenIds(seen);
}

export function markAllPendingSeen(): void {
  saveSeenIds(new Set(getPendingRequests().map((r) => r.id)));
}

export function peekUnseenRequest(): CareRequest | null {
  if (typeof window === "undefined") return null;
  if (!getPrefs().notifyRequests) return null;
  const seen = getSeenIds();
  return getPendingRequests().find((r) => !seen.has(r.id)) ?? null;
}

