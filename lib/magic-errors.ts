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

  if (/allowlist|unauthorized domain|blocked|redirect/i.test(raw)) {
    const host = typeof window !== "undefined" ? window.location.host : "your-domain";
    return `Domain/redirect not allowlisted. Add "${host}" and "https://${host}/login/oauth" in Magic Dashboard → Allowed Origins & Redirects.`;
  }

  if (/Invalid redirect URL|invalid redirect/i.test(raw)) {
    return "Magic rejected the redirect URL. Use only https://your-app/login/oauth in Magic Redirects (custom schemes like Lumina:// are not valid as OAuth redirectURI).";
  }

  if (/MISSING_PKCE_METADATA|OAuth session metadata not found/i.test(raw)) {
    return "Sign-in session was lost after leaving the app. Update to the latest TestFlight build (needs native Preferences plugin), then try Google/Apple again.";
  }

  if (/cancelled|closed-by-user|user closed/i.test(raw)) {
    return "Sign-in was cancelled. If this keeps happening in the iOS app, rebuild after updating Capacitor allowNavigation so Google/Apple stay in-app.";
  }

  return raw;
}
