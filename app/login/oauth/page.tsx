"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { getMagicNativeDeepLink, handleMagicOAuthRedirect } from "@/lib/magic";
import {
  clearMagicPkceServer,
  restoreMagicPkceFromServer,
} from "@/lib/magic-pkce-bridge";
import { api } from "@/lib/api-client";
import { loginAndHydrate } from "@/lib/sync";
import { getPostLoginPath } from "@/lib/auth";
import { auth } from "@/lib/copy";
import { markMagicMomentPending } from "@/lib/magic-moment";
import { formatMagicAuthError } from "@/lib/magic-errors";

const HANDOFF_FLAG = "lumina_oauth_handoff_once";

function isIosBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

async function waitForNativeApp(ms = 600): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      if (Capacitor.isNativePlatform()) return true;
    } catch {
      /* bridge not ready */
    }
    await new Promise((r) => setTimeout(r, 40));
  }
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

async function completeWithDidToken(didToken: string): Promise<void> {
  const verified = await api.magicVerify(didToken);
  if (!verified.ok) throw new Error(verified.error);
  await loginAndHydrate(verified.data.user);
  markMagicMomentPending();
}

async function restorePkceWithRetry(state: string | null): Promise<boolean> {
  for (let i = 0; i < 4; i++) {
    if (await restoreMagicPkceFromServer(state)) return true;
    await new Promise((r) => setTimeout(r, 350 * (i + 1)));
  }
  return false;
}

export default function MagicOAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [handoff, setHandoff] = useState(false);
  const [handoffHref, setHandoffHref] = useState("");
  const [status, setStatus] = useState(auth.magicSigningIn);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const search = window.location.search;
      const hash = window.location.hash;
      const params = new URLSearchParams(search);
      const state = params.get("state");
      const didParam = params.get("did");
      const inNative = await waitForNativeApp();

      try {
        if (didParam) {
          setStatus("Opening your care wallet…");
          await completeWithDidToken(didParam);
          if (!cancelled) router.replace(getPostLoginPath());
          return;
        }

        const hasOAuthParams =
          params.has("code") || params.has("state") || hash.includes("code");
        if (!hasOAuthParams) {
          throw new Error("Missing sign-in details. Go back and try Google/Apple again.");
        }

        setStatus("Restoring secure sign-in…");
        await restorePkceWithRetry(state);

        setStatus(auth.magicSigningIn);
        const result = await Promise.race([
          handleMagicOAuthRedirect(),
          new Promise<null>((_, reject) =>
            window.setTimeout(
              () => reject(new Error("Sign-in timed out. Please try again.")),
              25_000
            )
          ),
        ]);

        if (!result?.didToken) {
          throw new Error(
            "Sign-in failed after redirect. Confirm Magic Redirects includes " +
              `${window.location.origin}/login/oauth`
          );
        }

        await completeWithDidToken(result.didToken);
        await clearMagicPkceServer(state);

        // Only Safari needs a deep-link handoff (cookies aren't shared with the app WebView).
        if (!inNative && isIosBrowser()) {
          const deep = `Lumina://login/oauth?did=${encodeURIComponent(result.didToken)}`;
          setHandoffHref(deep);
          setHandoff(true);
          setStatus("Opening Lumina…");
          window.location.href = deep;
          return;
        }

        if (!cancelled) router.replace(getPostLoginPath());
      } catch (err) {
        if (!inNative && isIosBrowser() && (search || hash)) {
          const already = sessionStorage.getItem(HANDOFF_FLAG);
          if (!already) {
            sessionStorage.setItem(HANDOFF_FLAG, "1");
            const deep = getMagicNativeDeepLink(search, hash);
            setHandoffHref(deep);
            setHandoff(true);
            window.location.href = deep;
            return;
          }
        }
        if (!cancelled) setError(formatMagicAuthError(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="page-canvas page-loading flex-col gap-4 px-6 text-center">
        <p className="text-negative text-sm max-w-sm">{error}</p>
        <button type="button" onClick={() => router.replace("/login")} className="btn-secondary">
          {auth.walletBootRetry}
        </button>
      </div>
    );
  }

  if (handoff) {
    const deepLink =
      handoffHref ||
      getMagicNativeDeepLink(
        typeof window !== "undefined" ? window.location.search : "",
        typeof window !== "undefined" ? window.location.hash : ""
      );
    return (
      <div className="page-canvas page-loading flex-col gap-4 px-6 text-center">
        <Loader2 size={28} className="animate-spin text-glow" />
        <p className="text-caption text-sm">Opening Lumina…</p>
        <a href={deepLink} className="btn-primary">
          Open Lumina app
        </a>
      </div>
    );
  }

  return (
    <div className="page-canvas page-loading flex-col gap-3">
      <Loader2 size={28} className="animate-spin text-glow" />
      <p className="text-caption text-sm">{status}</p>
    </div>
  );
}
