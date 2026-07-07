"use client";

import { ExternalLink, Wallet } from "lucide-react";
import { useMagicWallet } from "@/app/providers/MagicWalletProvider";
import { isTestnetMode } from "@/lib/chain-config";
import { magicFund } from "@/lib/copy";

export default function MagicFundBanner() {
  const { isMagicMode, balanceUsd, hasGas, address } = useMagicWallet();

  if (!isMagicMode || !address) return null;

  const testnet = isTestnetMode();
  const needsUsdt = balanceUsd == null || balanceUsd < 1;
  const needsGas = !hasGas;
  if (!needsUsdt && !needsGas) return null;

  const fund = testnet ? magicFund.testnet : magicFund;
  const fundHref = testnet
    ? needsUsdt
      ? "https://faucet.circle.com/"
      : "https://www.alchemy.com/faucets/ethereum-sepolia"
    : "https://bridge.arbitrum.io";

  return (
    <div className="magic-fund-banner">
      <div className="magic-fund-icon">
        <Wallet size={18} />
      </div>
      <div className="magic-fund-text">
        <p className="magic-fund-title">{fund.title}</p>
        <p className="magic-fund-sub">
          {needsUsdt && needsGas
            ? fund.subBoth
            : needsUsdt
              ? fund.subUsdt
              : fund.subGas}
        </p>
      </div>
      <a
        href={fundHref}
        target="_blank"
        rel="noopener noreferrer"
        className="magic-fund-link"
      >
        {fund.bridge}
        <ExternalLink size={14} aria-hidden />
      </a>
    </div>
  );
}