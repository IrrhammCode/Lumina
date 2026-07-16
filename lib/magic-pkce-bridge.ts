"use client";

const PKCE_KEY = "magic_oauth_pkce_verifier";
const PREF_KEY = "lumina_magic_oauth_pkce";

type PreferencesMod = {
  Preferences: {
    set: (opts: { key: string; value: string }) => Promise<void>;
    get: (opts: { key: string }) => Promise<{ value: string | null }>;
    remove: (opts: { key: string }) => Promise<void>;
  };
};

async function getPreferences(): Promise<PreferencesMod["Preferences"] | null> {
  try {
    const mod = (await import("@capacitor/preferences")) as PreferencesMod;
    return mod.Preferences;
  } catch {
    return null;
  }
}

/** Mirror Magic PKCE into native Preferences whenever the SDK writes it. */
export function installMagicPkceBridge(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const mirror = (value: string) => {
    void (async () => {
      const Preferences = await getPreferences();
      if (!Preferences) return;
      try {
        await Preferences.set({ key: PREF_KEY, value });
      } catch {
        /* native plugin unavailable */
      }
    })();
  };

  const wrap = (storage: Storage) => {
    const original = storage.setItem.bind(storage);
    storage.setItem = (key: string, value: string) => {
      original(key, value);
      if (key === PKCE_KEY && value) mirror(value);
    };
    return () => {
      storage.setItem = original;
    };
  };

  const restoreLocal = wrap(window.localStorage);
  const restoreSession = wrap(window.sessionStorage);

  // If Magic already wrote PKCE before the bridge installed, capture it.
  const existing =
    window.localStorage.getItem(PKCE_KEY) ?? window.sessionStorage.getItem(PKCE_KEY);
  if (existing) mirror(existing);

  return () => {
    restoreLocal();
    restoreSession();
  };
}

/** Restore PKCE into WebView storage before Magic getRedirectResult(). */
export async function restoreMagicPkceFromNative(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const existing =
    window.localStorage.getItem(PKCE_KEY) ?? window.sessionStorage.getItem(PKCE_KEY);
  if (existing) return true;

  const Preferences = await getPreferences();
  if (!Preferences) return false;

  try {
    const { value } = await Preferences.get({ key: PREF_KEY });
    if (!value) return false;
    window.localStorage.setItem(PKCE_KEY, value);
    window.sessionStorage.setItem(PKCE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

export async function clearMagicPkceNative(): Promise<void> {
  const Preferences = await getPreferences();
  if (!Preferences) return;
  try {
    await Preferences.remove({ key: PREF_KEY });
  } catch {
    /* ignore */
  }
}
