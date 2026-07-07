"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { handleMagicOAuthRedirect } from "@/lib/magic";
import { api } from "@/lib/api-client";
import { loginAndHydrate } from "@/lib/sync";
import { getPostLoginPath } from "@/lib/auth";
import { auth } from "@/lib/copy";
import { markMagicMomentPending } from "@/lib/magic-moment";

export default function MagicOAuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const result = await handleMagicOAuthRedirect();
      if (!result?.didToken) {
        setError("Sign-in was cancelled or failed");
        return;
      }

      const verified = await api.magicVerify(result.didToken);
      if (!verified.ok) {
        setError(verified.error);
        return;
      }

      await loginAndHydrate(verified.data.user);
      markMagicMomentPending();
      router.replace(getPostLoginPath());
    })();
  }, [router]);

  if (error) {
    return (
      <div className="page-canvas page-loading flex-col gap-4 px-6 text-center">
        <p className="text-negative text-sm">{error}</p>
        <button type="button" onClick={() => router.replace("/login")} className="btn-secondary">
          {auth.walletBootRetry}
        </button>
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