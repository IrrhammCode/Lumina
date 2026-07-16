export function formatMagicAuthError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Sign-in failed";

  if (/RPC route not enabled|provider not supported/i.test(raw)) {
    return "Google/Apple login is not enabled for this Magic app. Open Magic Dashboard → Social Login → turn on Google (and Apple), then Test Connection.";
  }

  if (/not support this method|Magic Auth app instead/i.test(raw)) {
    return "This API key is not an Embedded Wallet (Auth) app. Create an Embedded Wallet app in Magic Dashboard and use its publishable key.";
  }

  if (/allowlist|unauthorized domain|blocked/i.test(raw)) {
    return `Domain not allowlisted. Add "${typeof window !== "undefined" ? window.location.host : "your-domain"}" in Magic Dashboard → Allowed Origins.`;
  }

  return raw;
}