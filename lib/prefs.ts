import { api } from "./api-client";
import { isLoggedIn } from "./auth";
import { detectBiometricLabel } from "./webauthn-client";

export type LuminaPrefs = {
  notifyRequests: boolean;
  notifyAutopilot: boolean;
  notifyPromos: boolean;
  biometricEnabled: boolean;
};

const PREFS_KEY = "lumina_prefs";

export const DEFAULT_PREFS: LuminaPrefs = {
  notifyRequests: true,
  notifyAutopilot: true,
  notifyPromos: false,
  biometricEnabled: true,
};

export function getPrefs(): LuminaPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<LuminaPrefs>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs: LuminaPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  if (isLoggedIn()) void api.patchPrefs(prefs);
}

export function updatePrefs(patch: Partial<LuminaPrefs>): LuminaPrefs {
  const next = { ...getPrefs(), ...patch };
  savePrefs(next);
  return next;
}

export function notificationsLabel(): string {
  const p = getPrefs();
  const on = [p.notifyRequests, p.notifyAutopilot, p.notifyPromos].filter(Boolean).length;
  if (on === 3) return "All on";
  if (on === 0) return "Off";
  return `${on} on`;
}

export function securityLabel(): string {
  if (!getPrefs().biometricEnabled) return "Off";
  return detectBiometricLabel();
}