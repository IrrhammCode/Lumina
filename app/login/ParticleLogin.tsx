"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Loader2, Wallet } from "lucide-react";
import { useAccount, useModal } from "@particle-network/connectkit";
import AuthShell from "@/components/AuthShell";
import { getPostLoginPath } from "@/lib/auth";
import { slideBack } from "@/lib/motion";
import { auth, actions } from "@/lib/copy";

function persistWalletUser(address: string) {
  localStorage.setItem(
    "lumina_user",
    JSON.stringify({
      email: `${address.slice(0, 6)}…${address.slice(-4)}@wallet`,
      loggedIn: true,
      walletAddress: address,
    })
  );
}

export default function ParticleLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address } = useAccount();
  const { setOpen } = useModal({
    onConnect: ({ address: connected }) => {
      if (connected) {
        persistWalletUser(connected);
        router.replace(getPostLoginPath());
      }
    },
  });

  useEffect(() => {
    if (isConnected && address) {
      persistWalletUser(address);
      router.replace(getPostLoginPath());
    }
  }, [isConnected, address, router]);

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
          <button type="button" onClick={openConnect} disabled={isLoading} className="auth-social-btn">
            {auth.google}
          </button>
          <button type="button" onClick={openConnect} disabled={isLoading} className="auth-social-btn">
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
        <p className="auth-terms">{auth.terms}</p>
      </motion.div>
    </AuthShell>
  );
}