import {
  startAuthentication,
  startRegistration,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/browser";
import { api } from "./api-client";

export type BiometricPurpose = "unlock" | "approve" | "activate" | "pay" | "default";

const ENROLLED_KEY = "lumina_passkey_enrolled";

export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && browserSupportsWebAuthn();
}

export async function isPlatformBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

/** Face ID on iPhone, Touch ID on Mac, fingerprint on Android */
export function detectBiometricLabel(): string {
  if (typeof navigator === "undefined") return "Face ID";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "Face ID";
  if (/Macintosh/.test(ua)) return "Touch ID";
  if (/Android/.test(ua)) return "Fingerprint";
  return "Biometrics";
}

export function getLocalPasskeyEnrolled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENROLLED_KEY) === "1";
}

export function setLocalPasskeyEnrolled(enrolled: boolean): void {
  if (typeof window === "undefined") return;
  if (enrolled) {
    localStorage.setItem(ENROLLED_KEY, "1");
  } else {
    localStorage.removeItem(ENROLLED_KEY);
  }
}

export async function syncPasskeyStatus(): Promise<boolean> {
  const result = await api.webauthnStatus();
  if (!result.ok) return getLocalPasskeyEnrolled();
  setLocalPasskeyEnrolled(result.data.enrolled);
  return result.data.enrolled;
}

export async function registerPasskey(deviceName?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: "Biometrics not supported on this device" };
  }

  const optionsResult = await api.webauthnRegisterOptions();
  if (!optionsResult.ok) return { ok: false, error: optionsResult.error };

  let response: RegistrationResponseJSON;
  try {
    response = await startRegistration({
      optionsJSON: optionsResult.data.options,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration cancelled";
    return { ok: false, error: message };
  }

  const verifyResult = await api.webauthnRegisterVerify(
    response,
    optionsResult.data.challengeToken,
    deviceName ?? detectBiometricLabel()
  );

  if (!verifyResult.ok) return { ok: false, error: verifyResult.error };

  setLocalPasskeyEnrolled(true);
  return { ok: true };
}

export async function authenticatePasskey(
  purpose: BiometricPurpose = "default"
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, error: "Biometrics not supported" };
  }

  const optionsResult = await api.webauthnAuthOptions(purpose);
  if (!optionsResult.ok) return { ok: false, error: optionsResult.error };

  let response: AuthenticationResponseJSON;
  try {
    response = await startAuthentication({
      optionsJSON: optionsResult.data.options,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification cancelled";
    return { ok: false, error: message };
  }

  const verifyResult = await api.webauthnAuthVerify(
    response,
    optionsResult.data.challengeToken,
    purpose
  );

  if (!verifyResult.ok) return { ok: false, error: verifyResult.error };

  return { ok: true };
}

export async function removePasskey(): Promise<boolean> {
  const result = await api.webauthnRemove();
  if (!result.ok) return false;
  setLocalPasskeyEnrolled(false);
  return true;
}