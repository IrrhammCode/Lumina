import { api } from "./api-client";
import { getPayments } from "./allowances";
import type { LuminaUser } from "./auth";
import { cacheUser, setOnboardedFromServer } from "./auth";
import { emitNewRequest } from "./events";
import { notifyAutopilotQueue, notifyNewRequest } from "./notifications";
import { getPendingRequests, getRequests, type CareRequest } from "./requests";

const FAMILY_KEY = "lumina_family";
const REQUESTS_KEY = "lumina_requests";
const RULES_KEY = "lumina_rules";
const PAYMENTS_KEY = "lumina_payments";
const PREFS_KEY = "lumina_prefs";
const SEEDED_KEY = "lumina_seeded";
const REQUESTS_SEEDED = "lumina_requests_seeded";
export const SERVER_BACKED_KEY = "lumina_server_backed";

export const INBOX_POLL_MS = 8_000;

let lastAutopilotQueueId: string | null = null;

function detectAutopilotQueueChange(): void {
  const queued = getPayments().find((p) => p.type === "auto" && p.status === "pending");
  if (queued && queued.id !== lastAutopilotQueueId) {
    lastAutopilotQueueId = queued.id;
    notifyAutopilotQueue(queued);
  } else if (!queued) {
    lastAutopilotQueueId = null;
  }
}

export async function tickAutopilot(): Promise<void> {
  await api.autopilotTick();
  await hydrateFromServer();
}

export function isServerBacked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SERVER_BACKED_KEY) === "1";
}

export function applyUserDataToCache(data: {
  prefs: import("./prefs").LuminaPrefs;
  family: import("./family").FamilyMember[];
  requests: import("./requests").CareRequest[];
  rules: import("./allowances").AllowanceRule[];
  payments: import("./allowances").PaymentRecord[];
}): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(data.prefs));
  localStorage.setItem(FAMILY_KEY, JSON.stringify(data.family));
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(data.requests));
  localStorage.setItem(RULES_KEY, JSON.stringify(data.rules));
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(data.payments));
  localStorage.setItem(SEEDED_KEY, "1");
  localStorage.setItem(REQUESTS_SEEDED, "1");
  localStorage.setItem(SERVER_BACKED_KEY, "1");
}

export async function hydrateFromServer(): Promise<boolean> {
  const result = await api.getUserData();
  if (!result.ok) return false;
  applyUserDataToCache(result.data);
  detectAutopilotQueueChange();
  return true;
}

export async function pollInbox(): Promise<{ pending: CareRequest[]; changed: boolean }> {
  const prevIds = new Set(getRequests().map((r) => r.id));
  const ok = await hydrateFromServer();
  if (!ok) {
    return { pending: getPendingRequests(), changed: false };
  }

  let changed = false;
  for (const request of getRequests()) {
    if (!prevIds.has(request.id) && request.status === "pending") {
      emitNewRequest(request);
      notifyNewRequest(request);
      changed = true;
    }
  }

  return { pending: getPendingRequests(), changed };
}

export function persistAuthUser(
  user: LuminaUser & { portalToken?: string; onboarded?: boolean }
): void {
  cacheUser({
    email: user.email,
    loggedIn: true,
    walletAddress: user.walletAddress,
    portalToken: user.portalToken,
  });
  if (user.onboarded) setOnboardedFromServer();
}

export async function loginAndHydrate(
  user: LuminaUser & { portalToken?: string; onboarded?: boolean }
): Promise<void> {
  persistAuthUser(user);
  await hydrateFromServer();
}

export async function restoreSession(): Promise<LuminaUser | null> {
  const result = await api.getSession();
  if (!result.ok) return null;
  persistAuthUser(result.data.user);
  await hydrateFromServer();
  return {
    email: result.data.user.email,
    loggedIn: true,
    walletAddress: result.data.user.walletAddress,
    portalToken: result.data.user.portalToken,
  };
}

export async function logoutFromServer(): Promise<void> {
  await api.logout();
  if (typeof window !== "undefined") {
    localStorage.removeItem(SERVER_BACKED_KEY);
  }
}