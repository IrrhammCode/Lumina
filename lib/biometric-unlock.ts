import { getPrefs } from "./prefs";
import { getLocalPasskeyEnrolled } from "./webauthn-client";

const UNLOCK_KEY = "lumina_bio_unlocked";
const UNLOCK_TTL_MS = 30 * 60 * 1000; // 30 min per session

type UnlockRecord = { at: number };

export function isBiometricUnlockRequired(): boolean {
  if (typeof window === "undefined") return false;
  if (!getPrefs().biometricEnabled) return false;
  if (!getLocalPasskeyEnrolled()) return false;
  return !isBiometricUnlocked();
}

export function isBiometricUnlocked(): boolean {
  if (typeof window === "undefined") return true;
  const raw = sessionStorage.getItem(UNLOCK_KEY);
  if (!raw) return false;
  try {
    const record = JSON.parse(raw) as UnlockRecord;
    return Date.now() - record.at < UNLOCK_TTL_MS;
  } catch {
    return false;
  }
}

export function setBiometricUnlocked(): void {
  if (typeof window === "undefined") return;
  const record: UnlockRecord = { at: Date.now() };
  sessionStorage.setItem(UNLOCK_KEY, JSON.stringify(record));
}

export function clearBiometricUnlock(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(UNLOCK_KEY);
}