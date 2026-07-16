/** WebAuthn relying party — must match the browser origin (not localhost on ngrok/Vercel). */

function parseAppUrl(): { origin: string; rpId: string } | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return { origin: url.origin, rpId: url.hostname };
  } catch {
    return null;
  }
}

export function getWebAuthnRpId(): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const app = parseAppUrl();
  if (app) return app.rpId;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return vercel.replace(/^https?:\/\//, "").split(":")[0]!;
  return "localhost";
}

export function getWebAuthnOrigin(): string {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN;
  const app = parseAppUrl();
  if (app) return app.origin;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return "http://localhost:3000";
}

export function getWebAuthnRpName(): string {
  return "Lumina";
}