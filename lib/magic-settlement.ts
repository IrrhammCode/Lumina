"use client";

import { BrowserProvider, Contract, parseUnits } from "ethers";
import { getMagicProvider, getMagicWalletAddress } from "./magic";
import { getCarePayoutAddress } from "./particle-config";
import { ERC20_ABI, USDT_ARBITRUM } from "./onchain";
import { arbiscanTxUrl } from "./settlement-mode";
import type { SettlementResult } from "./settlement";

export class MagicSettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MagicSettlementError";
  }
}

/** Send USDT on Arbitrum from the Magic embedded wallet to the care treasury. */
export async function settleWithMagicWallet(amount: number): Promise<SettlementResult> {
  const rpcProvider = getMagicProvider();
  if (!rpcProvider) {
    throw new MagicSettlementError("Magic wallet is not available");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new MagicSettlementError("Invalid payment amount");
  }

  const treasury = getCarePayoutAddress();
  const provider = new BrowserProvider(rpcProvider);
  const signer = await provider.getSigner();
  const address = await getMagicWalletAddress();

  const ethBalance = await provider.getBalance(address ?? treasury);
  if (ethBalance === BigInt(0)) {
    throw new MagicSettlementError(
      "Add a small amount of ETH on Arbitrum for gas — your Magic wallet needs it to send USDT"
    );
  }

  const usdt = new Contract(USDT_ARBITRUM, ERC20_ABI, signer);
  const units = parseUnits(amount.toFixed(2), 6);

  const balance: bigint = await usdt.balanceOf(address);
  if (balance < units) {
    throw new MagicSettlementError(
      `Insufficient USDT — need $${amount.toFixed(2)} on Arbitrum in your Magic wallet`
    );
  }

  try {
    const tx = await usdt.transfer(treasury, units);
    const receipt = await tx.wait();
    const txHash = receipt?.hash ?? tx.hash;

    return {
      ref: txHash,
      txHash,
      explorerUrl: arbiscanTxUrl(txHash),
      mode: "magic",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Transaction failed";
    throw new MagicSettlementError(msg);
  }
}