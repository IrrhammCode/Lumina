"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Loader2, Wallet } from "lucide-react";
import { useAccount, useModal } from "@particle-network/connectkit";
import type { Connector } from "@particle-network/connector-core";
import AuthShell from "@/components/AuthShell";
import { getPostLoginPath } from "@/lib/auth";
import { slideBack } from "@/lib/motion";
import { auth, actions } from "@/lib/copy";
import { api } from "@/lib/api-client";
import { loginAndHydrate } from "@/lib/sync";
import { signSiweMessage } from "@/lib/siwe-client";

async function persistWalletUser(address: string, connector: Connector): Promise<boolean> {
  const challenge = await api.walletChallenge(address);
  if (!challenge.ok) {
    if (process.env.NODE_ENV !== "production") {
      const fallback = await api.walletLogin(address);
      if (!fallback.ok) return false;
      await loginAndHydrate(fallback.data.user);
      return true;
    }
    return false;
  }

  const signature = await signSiweMessage(connector, challenge.data.message);
  const result = await api.walletVerify(address, challenge.data.message, signature);
  if (!result.ok) return false;
  await loginAndHydrate(result.data.user);
  return true;
}

export default function ParticleLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const signingRef = useRef(false);
  const { isConnected, address, connector } = useAccount();
  const { setOpen } = useModal();

  useEffect(() => {
    if (!isConnected || !address || !connector || signingRef.current) return;
    void (async () => {
      signingRef.current = true;
      setIsLoading(true);
      setError("");
      try {
        const ok = await persistWalletUser(address, connector);
        if (ok) router.replace(getPostLoginPath());
        else setError("Wallet login failed");
      } catch {
        setError("Wallet signature was rejected");
      } finally {
        setIsLoading(false);
        signingRef.current = false;
      }
    })();
  }, [isConnected, address, connector, router]);

  const openConnect = () => {
    setIsLoading(true);
    setOpen(true);
    setTimeout(() => setIsLoading(false), 600);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    openConnect();
  };

  const handleSocial = async (provider: "google" | "apple") => {
    setIsLoading(true);
    setError("");
    const result = await api.socialLogin(provider, email || undefined);
    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      return;
    }
    await loginAndHydrate(result.data.user);
    router.replace(getPostLoginPath());
    setIsLoading(false);
  };

  return (
    <AuthShell
      variant="login"
      title={auth.signIn}
      subtitle={auth.signInSub}
      onBack={() => router.back()}
    >
      <motion.div key="particle" variants={slideBack} initial="initial" animate="animate" exit="exit">
        <div className="auth-wallet-panel">
          <div className="auth-wallet-icon">
            <Wallet size={26} className="text-glow" />
          </div>
          <p className="auth-wallet-hint">{auth.walletHint}</p>
          <button type="button" onClick={openConnect} disabled={isLoading} className="btn-primary auth-wallet-cta">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : auth.walletCta}
          </button>
        </div>

        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">{auth.emailOr}</span>
          <div className="auth-divider-line" />
        </div>

        <div className="auth-social-row">
          <button type="button" onClick={() => handleSocial("google")} disabled={isLoading} className="auth-social-btn">
            {auth.google}
          </button>
          <button type="button" onClick={() => handleSocial("apple")} disabled={isLoading} className="auth-social-btn">
            {auth.apple}
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="auth-field-wrap">
            <Mail size={18} className="auth-field-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={auth.emailPh}
              className="auth-field-input"
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={isLoading || !email} className="btn-secondary w-full">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : actions.continue}
          </button>
        </form>
        {error && <p className="text-negative text-xs text-center mt-3">{error}</p>}
        <p className="auth-terms">{auth.terms}</p>
      </motion.div>
    </AuthShell>
  );
}