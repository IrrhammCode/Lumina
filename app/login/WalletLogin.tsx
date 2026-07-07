"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, RefreshCw } from "lucide-react";
import { useAccount, useModal } from "@particle-network/connectkit";
import type { Connector } from "@particle-network/connector-core";
import AuthShell from "@/components/AuthShell";
import { getPostLoginPath } from "@/lib/auth";
import { auth } from "@/lib/copy";
import { api } from "@/lib/api-client";
import { loginAndHydrate } from "@/lib/sync";
import { signSiweMessage } from "@/lib/siwe-client";
import { connectInjectedWallet, signInjectedMessage } from "@/lib/injected-wallet";
import { hasParticleConfig } from "@/lib/particle-config";
import { useConnectKitReady, useConnectKitStatus } from "@/app/providers/ParticleProvider";
import { preloadConnectKit } from "@/lib/connectkit-preload";

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

function WalletLoginBoot() {
  const router = useRouter();
  const { loading, error, retry } = useConnectKitStatus();
  const [devAddress, setDevAddress] = useState("");
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");

  useEffect(() => {
    preloadConnectKit();
  }, []);

  const onDevSignIn = async () => {
    const address = devAddress.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setDevError("Enter a valid 0x address");
      return;
    }
    setDevLoading(true);
    setDevError("");
    const result = await api.walletLogin(address);
    if (!result.ok) {
      setDevError(result.error);
      setDevLoading(false);
      return;
    }
    await loginAndHydrate(result.data.user);
    router.replace(getPostLoginPath());
  };

  return (
    <AuthShell
      variant="login"
      title={auth.walletBootTitle}
      subtitle={auth.walletBootSub}
      onBack={() => router.back()}
    >
      <div className="auth-wallet-panel">
        <div className="auth-wallet-icon">
          {loading ? (
            <Loader2 size={26} className="text-glow animate-spin" />
          ) : (
            <Wallet size={26} className="text-glow" />
          )}
        </div>
        <p className="auth-wallet-hint">
          {error ? "Wallet SDK failed to load." : auth.walletBootSub}
        </p>
        {(error || !loading) && (
          <button type="button" onClick={retry} className="btn-secondary auth-wallet-cta">
            <RefreshCw size={16} />
            {auth.walletBootRetry}
          </button>
        )}
        <p className="text-caption text-xs text-center mt-3">{auth.walletBootHint}</p>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-4 space-y-2 w-full">
            <p className="text-caption text-xs text-center">{auth.walletBootDevHint}</p>
            <div className="auth-field-wrap">
              <input
                type="text"
                value={devAddress}
                onChange={(e) => setDevAddress(e.target.value)}
                placeholder="0x… dev wallet address"
                className="auth-field-input"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              onClick={onDevSignIn}
              disabled={devLoading}
              className="btn-primary auth-wallet-cta"
            >
              {devLoading ? <Loader2 size={18} className="animate-spin" /> : "Dev sign-in"}
            </button>
            {devError && <p className="text-negative text-xs text-center">{devError}</p>}
          </div>
        )}
      </div>
    </AuthShell>
  );
}

function WalletLoginParticle() {
  const router = useRouter();
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
  }, [isConnected, address, connector, router]);

  const onConnect = () => {
    setError("");
    setIsLoading(true);
    try {
      setOpen(true);
    } catch {
      setError("Could not open wallet modal — try again");
    } finally {
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  return (
    <AuthShell variant="login" title={auth.signIn} subtitle={auth.signInSubWeb3} onBack={() => router.back()}>
      <motion.div key="wallet" initial={false} animate={{ opacity: 1, x: 0 }}>
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

function WalletLoginInjected() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const signingRef = useRef(false);

  const onConnect = async () => {
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

  return (
    <AuthShell variant="login" title={auth.signIn} subtitle={auth.signInSubWeb3} onBack={() => router.back()}>
      <motion.div key="wallet" initial={false} animate={{ opacity: 1, x: 0 }}>
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

export default function WalletLogin() {
  const particleEnabled = hasParticleConfig();
  const connectKitReady = useConnectKitReady();

  if (!particleEnabled) return <WalletLoginInjected />;
  if (!connectKitReady) return <WalletLoginBoot />;
  return <WalletLoginParticle />;
}