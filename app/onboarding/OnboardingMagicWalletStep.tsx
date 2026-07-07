"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Sparkles, Wallet } from "lucide-react";
import { useMagicWallet } from "@/app/providers/MagicWalletProvider";
import { shortAddress } from "@/lib/format";
import { onboarding } from "@/lib/copy";
import { fadeScale } from "@/lib/motion";

export default function OnboardingMagicWalletStep() {
  const { address, ready, isMagicMode } = useMagicWallet();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(t);
  }, [ready]);

  if (!ready) {
    return (
      <div className="onboard-wallet-waiting">
        <Loader2 size={28} className="animate-spin text-glow" />
        <p className="text-caption text-sm">{onboarding.magicWalletWaiting}</p>
      </div>
    );
  }

  return (
    <motion.div variants={fadeScale} initial="initial" animate="animate" className="onboard-magic-wallet">
      <motion.div
        className={`onboard-magic-reveal ${revealed ? "revealed" : ""}`}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="onboard-magic-orbit" aria-hidden>
          <span className="onboard-magic-orbit-ring" />
          <span className="onboard-magic-icon">
            <Wallet size={30} className="text-glow" />
          </span>
        </div>

        <div className="magic-trust-badge onboard-magic-badge">
          <Sparkles size={12} aria-hidden />
          {onboarding.magicWalletBadge}
        </div>

        <h3 className="onboard-magic-headline">{onboarding.magicWalletHeadline}</h3>
        <p className="onboard-magic-hint">{onboarding.magicWalletSub}</p>

        {isMagicMode && address ? (
          <div className="onboard-magic-id-card">
            <div className="onboard-wallet-check">
              <Check size={18} strokeWidth={3} />
            </div>
            <div className="flex-1 text-left">
              <p className="onboard-magic-id-label">{onboarding.magicWalletIdLabel}</p>
              <p className="onboard-magic-id-value">{shortAddress(address)}</p>
            </div>
          </div>
        ) : (
          <p className="text-caption text-xs text-center">{onboarding.magicWalletDemo}</p>
        )}
      </motion.div>
    </motion.div>
  );
}