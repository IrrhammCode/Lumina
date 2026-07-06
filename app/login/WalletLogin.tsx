"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
import { useAccount, useModal } from "@particle-network/connectkit";
import type { Connector } from "@particle-network/connector-core";
import AuthShell from "@/components/AuthShell";
import { getPostLoginPath } from "@/lib/auth";
import { slideBack } from "@/lib/motion";
import { auth } from "@/lib/copy";
import { api } from "@/lib/api-client";
import { loginAndHydrate } from "@/lib/sync";
import { signSiweMessage } from "@/lib/siwe-client";
import { connectInjectedWallet, signInjectedMessage } from "@/lib/injected-wallet";
import { hasParticleConfig } from "@/lib/particle-config";

async function siweWithConnector(address: string, connector: Connector): Promise<boolean> {
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

async function siweWithInjected(address: string): Promise<boolean> {
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
  const signature = await signInjectedMessage(address, challenge.data.message);
  const result = await api.walletVerify(address, challenge.data.message, signature);
  if (!result.ok) return false;
  await loginAndHydrate(result.data.user);
  return true;
}

export default function WalletLogin() {
  const router = useRouter();
  const isParticle = hasParticleConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const signingRef = useRef(false);

  const { isConnected, address, connector } = useAccount();
  const { setOpen } = useModal();

  useEffect(() => {
    if (!isParticle || !isConnected || !address || !connector || signingRef.current) return;
    void (async () => {
      signingRef.current = true;
      setIsLoading(true);
      setError("");
      try {
        const ok = await siweWithConnector(address, connector);
        if (ok) router.replace(getPostLoginPath());
        else setError("Wallet sign-in failed");
      } catch {
        setError("Wallet signature was rejected");
      } finally {
        setIsLoading(false);
        signingRef.current = false;
      }
    })();
  }, [isParticle, isConnected, address, connector, router]);

  const connectParticle = () => {
    setIsLoading(true);
    setOpen(true);
    setTimeout(() => setIsLoading(false), 600);
  };

  const connectInjected = async () => {
    setIsLoading(true);
    setError("");
    signingRef.current = true;
    try {
      const addr = await connectInjectedWallet();
      if (!addr) {
        setError("Install MetaMask or another Web3 wallet");
        return;
      }
      const ok = await siweWithInjected(addr);
      if (ok) router.replace(getPostLoginPath());
      else setError("Wallet sign-in failed");
    } catch {
      setError("Wallet signature was rejected");
    } finally {
      setIsLoading(false);
      signingRef.current = false;
    }
  };

  const onConnect = () => {
    if (isParticle) connectParticle();
    else void connectInjected();
  };

  return (
    <AuthShell variant="login" title={auth.signIn} subtitle={auth.signInSubWeb3} onBack={() => router.back()}>
      <motion.div key="wallet" variants={slideBack} initial="initial" animate="animate" exit="exit">
        <div className="auth-wallet-panel">
          <div className="auth-wallet-icon">
            <Wallet size={26} className="text-glow" />
          </div>
          <p className="auth-wallet-hint">{auth.walletHintWeb3}</p>
          <button type="button" onClick={onConnect} disabled={isLoading} className="btn-primary auth-wallet-cta">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : auth.walletCta}
          </button>
        </div>
        <p className="auth-terms">{auth.termsWeb3}</p>
        {error && <p className="text-negative text-xs text-center mt-3">{error}</p>}
      </motion.div>
    </AuthShell>
  );
}