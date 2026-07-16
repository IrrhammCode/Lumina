"use client";

import { Capacitor } from "@capacitor/core";

const PKCE_KEY = "magic_oauth_pkce_verifier";

let persistChain: Promise<void> = Promise.resolve();
let bridgeInstalled = false;

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
  const res = await fetch("/api/auth/oauth/pkce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, payload }),
    keepalive: true,
  });
  if (!res.ok) {
    throw new Error(`PKCE persist failed: ${res.status}`);
  }
}

function queuePersist(payload: string): void {
  persistChain = persistChain
    .catch(() => undefined)
    .then(() => persistToServer(payload));
}

/** Wait until queued PKCE uploads finish (call before leaving the page). */
export async function awaitMagicPkcePersisted(): Promise<void> {
  try {
    await persistChain;
  } catch {
    /* best-effort */
  }
}

/**
 * 1) Mirror Magic PKCE to server (durable handoff)
 * 2) On native: force OAuth into the same WebView + delay navigation until PKCE is saved
 */
export function installMagicPkceBridge(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (bridgeInstalled) return () => undefined;
  bridgeInstalled = true;

  const wrapStorage = (storage: Storage) => {
    const original = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      original(key, value);
      if (key === PKCE_KEY && value) queuePersist(value);
    };
    return () => {
      storage.setItem = original;
    };
  };

  const restoreLocal = wrapStorage(window.localStorage);
  const restoreSession = wrapStorage(window.sessionStorage);

  const existing =
    window.localStorage.getItem(PKCE_KEY) ?? window.sessionStorage.getItem(PKCE_KEY);
  if (existing) queuePersist(existing);

  const cleanups: Array<() => void> = [restoreLocal, restoreSession];

  if (Capacitor.isNativePlatform()) {
    const originalOpen = window.open.bind(window);
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      const href = typeof url === "string" ? url : url?.toString();
      if (href) {
        void (async () => {
          await awaitMagicPkcePersisted();
          window.location.assign(href);
        })();
        return null;
      }
      return originalOpen(url as string, target, features);
    }) as typeof window.open;
    cleanups.push(() => {
      window.open = originalOpen;
    });

    const assign = Location.prototype.assign;
    Location.prototype.assign = function assignPatched(this: Location, url: string | URL) {
      const href = typeof url === "string" ? url : url.toString();
      void (async () => {
        await awaitMagicPkcePersisted();
        assign.call(this, href);
      })();
    };
    cleanups.push(() => {
      Location.prototype.assign = assign;
    });

    const replace = Location.prototype.replace;
    Location.prototype.replace = function replacePatched(this: Location, url: string | URL) {
      const href = typeof url === "string" ? url : url.toString();
      void (async () => {
        await awaitMagicPkcePersisted();
        replace.call(this, href);
      })();
    };
    cleanups.push(() => {
      Location.prototype.replace = replace;
    });
  }

  return () => {
    bridgeInstalled = false;
    for (const stop of cleanups) stop();
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
    const res = await fetch(`/api/auth/oauth/pkce?state=${encodeURIComponent(state)}`, {
      cache: "no-store",
    });
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
