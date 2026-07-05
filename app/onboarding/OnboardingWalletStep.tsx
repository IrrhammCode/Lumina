"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Wallet } from "lucide-react";
import { useAccount, useModal } from "@particle-network/connectkit";
import { useLuminaUA } from "@/app/providers/UniversalAccountProvider";
import { shortAddress } from "@/lib/format";
import { onboarding } from "@/lib/copy";
import { fadeScale } from "@/lib/motion";

export default function OnboardingWalletStep() {
  const { isConnected, address } = useAccount();
  const { setOpen } = useModal();
  const { isUaMode, accountInfo, balanceUsd, ready } = useLuminaUA();

  if (!isConnected) {
    return (
      <motion.div variants={fadeScale} initial="initial" animate="animate" className="onboard-wallet-connect">
        <div className="onboard-wallet-icon">
          <Wallet size={30} className="text-glow" />
        </div>
        <p className="onboard-wallet-hint">{onboarding.walletSub}</p>
        <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full">
          {onboarding.walletConnect}
        </button>
        <p className="text-caption text-xs text-center">{onboarding.walletSkip}</p>
      </motion.div>
    );
  }

  if (!ready || !isUaMode) {
    return (
      <div className="onboard-wallet-waiting">
        <Loader2 size={28} className="animate-spin text-glow" />
        <p className="text-caption text-sm">{onboarding.walletWaiting}</p>
      </div>
    );
  }

  return (
    <motion.div variants={fadeScale} initial="initial" animate="animate" className="onboard-wallet-connected">
      <div className="onboard-wallet-success">
        <div className="onboard-wallet-check">
          <Check size={20} strokeWidth={3} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-ink">
            {onboarding.walletConnected(shortAddress(address!))}
          </p>
          {accountInfo?.useEIP7702 && (
            <p className="text-caption text-xs mt-0.5">{onboarding.walletEip7702}</p>
          )}
        </div>
      </div>
      {balanceUsd != null && balanceUsd > 0 && (
        <p className="onboard-wallet-balance">{onboarding.walletBalance(balanceUsd)}</p>
      )}
      <p className="onboard-wallet-hint text-center">{onboarding.walletSub}</p>
    </motion.div>
  );
}