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

function isMobileSafariHandoff(): boolean {
  if (typeof window === "undefined") return false;
  if (Capacitor.isNativePlatform()) return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function MagicOAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [handoff, setHandoff] = useState(false);

  useEffect(() => {
    void (async () => {
      const search = window.location.search;
      const hash = window.location.hash;
      const state = new URLSearchParams(search).get("state");

      // OAuth finished in Safari — bounce into the app with the same query.
      if (isMobileSafariHandoff() && (search || hash)) {
        // Restore + finish in Safari when possible, then open app with session cookie path...
        // PKCE is restored from server so getRedirectResult can run in whichever context has the URL.
        // Prefer completing inside the app after deep link (same query + server PKCE).
        const deepLink = getMagicNativeDeepLink(search, hash);
        setHandoff(true);
        window.location.href = deepLink;
        return;
      }

      try {
        await restoreMagicPkceFromServer(state);

        const result = await handleMagicOAuthRedirect();
        if (!result?.didToken) {
          setError(
            "Sign-in failed after redirect. Confirm Magic Redirects includes " +
              `${window.location.origin}/login/oauth`
          );
          return;
        }

        const verified = await api.magicVerify(result.didToken);
        if (!verified.ok) {
          setError(verified.error);
          return;
        }

        await clearMagicPkceServer(state);
        await loginAndHydrate(verified.data.user);
        markMagicMomentPending();
        router.replace(getPostLoginPath());
      } catch (err) {
        setError(formatMagicAuthError(err));
      }
    })();
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
    const deepLink = getMagicNativeDeepLink(
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
      <p className="text-caption text-sm">{auth.magicSigningIn}</p>
    </div>
  );
}
