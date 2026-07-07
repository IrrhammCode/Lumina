"use client";

import { ExternalLink, Wallet } from "lucide-react";
import { useMagicWallet } from "@/app/providers/MagicWalletProvider";
import { magicFund } from "@/lib/copy";

export default function MagicFundBanner() {
  const { isMagicMode, balanceUsd, hasGas, address } = useMagicWallet();

  if (!isMagicMode || !address) return null;

  const needsUsdt = balanceUsd == null || balanceUsd < 1;
  const needsGas = !hasGas;
  if (!needsUsdt && !needsGas) return null;

  return (
    <div className="magic-fund-banner">
      <div className="magic-fund-icon">
        <Wallet size={18} />
      </div>
      <div className="magic-fund-text">
        <p className="magic-fund-title">{magicFund.title}</p>
        <p className="magic-fund-sub">
          {needsUsdt && needsGas
            ? magicFund.subBoth
            : needsUsdt
              ? magicFund.subUsdt
              : magicFund.subGas}
        </p>
      </div>
      <a
        href="https://bridge.arbitrum.io"
        target="_blank"
        rel="noopener noreferrer"
        className="magic-fund-link"
      >
        {magicFund.bridge}
        <ExternalLink size={14} aria-hidden />
      </a>
    </div>
  );
}