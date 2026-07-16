"use client";

const PKCE_KEY = "magic_oauth_pkce_verifier";

function extractState(payload: string): string | null {
  try {
    const parsed = JSON.parse(payload) as { state?: string };
    return typeof parsed.state === "string" ? parsed.state : null;
  } catch {
    return null;
  }
}

async function persistToServer(payload: string): Promise<void> {
  const state = extractState(payload);
  if (!state) return;
  try {
    await fetch("/api/auth/oauth/pkce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, payload }),
      keepalive: true,
    });
  } catch {
    /* best-effort */
  }
}

/** Mirror Magic PKCE writes to the server so Safari → app handoff can restore them. */
export function installMagicPkceBridge(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const wrap = (storage: Storage) => {
    const original = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      original(key, value);
      if (key === PKCE_KEY && value) void persistToServer(value);
    };
    return () => {
      storage.setItem = original;
    };
  };

  const restoreLocal = wrap(window.localStorage);
  const restoreSession = wrap(window.sessionStorage);

  const existing =
    window.localStorage.getItem(PKCE_KEY) ?? window.sessionStorage.getItem(PKCE_KEY);
  if (existing) void persistToServer(existing);

  return () => {
    restoreLocal();
    restoreSession();
  };
}

/** Restore PKCE from server using OAuth `state` query param before getRedirectResult. */
export async function restoreMagicPkceFromServer(state: string | null): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const existing =
    window.localStorage.getItem(PKCE_KEY) ?? window.sessionStorage.getItem(PKCE_KEY);
  if (existing) return true;
  if (!state) return false;

  try {
    const res = await fetch(`/api/auth/oauth/pkce?state=${encodeURIComponent(state)}`);
    const json = (await res.json()) as { ok?: boolean; data?: { payload?: string } };
    const payload = json?.data?.payload;
    if (!res.ok || !payload) return false;
    window.localStorage.setItem(PKCE_KEY, payload);
    window.sessionStorage.setItem(PKCE_KEY, payload);
    return true;
  } catch {
    return false;
  }
}

export async function clearMagicPkceServer(state: string | null): Promise<void> {
  if (!state) return;
  try {
    await fetch(`/api/auth/oauth/pkce?state=${encodeURIComponent(state)}`, {
      method: "DELETE",
    });
  } catch {
    /* ignore */
  }
}
