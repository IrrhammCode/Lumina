/** WebAuthn relying party — works on localhost and production deploys */

export function getWebAuthnRpId(): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return vercel.replace(/^https?:\/\//, "").split(":")[0]!;
  return "localhost";
}

export function getWebAuthnOrigin(): string {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN;
  const vercel = process.env.VERCEL_URL;
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;
  return "http://localhost:3000";
}

export function getWebAuthnRpName(): string {
  return "Lumina";
}