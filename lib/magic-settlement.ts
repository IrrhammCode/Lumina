"use client";

import { BrowserProvider, Contract, parseUnits } from "ethers";
import { connectMagicWallet, getMagicProvider, getMagicWalletAddress } from "./magic";
import { getCarePayoutAddress } from "./particle-config";
import { getChainConfig } from "./chain-config";
import { ERC20_ABI, USDT_ARBITRUM } from "./onchain";
import { getStablecoinSymbol } from "./onchain";
import { arbiscanTxUrl } from "./settlement-mode";
import type { SettlementResult } from "./settlement";

export class MagicSettlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MagicSettlementError";
  }
}

/**
 * Send stablecoin via Magic embedded wallet → treasury.
 * Uses magic.rpcProvider (same as Web3(magic.rpcProvider) in Magic docs) + ethers signer.
 */
export async function settleWithMagicWallet(amount: number): Promise<SettlementResult> {
  const chain = getChainConfig();
  const symbol = getStablecoinSymbol();
  const rpcProvider = getMagicProvider();
  if (!rpcProvider) {
    throw new MagicSettlementError("Magic wallet is not available");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new MagicSettlementError("Invalid payment amount");
  }

  const treasury = getCarePayoutAddress();

  // ⭐️ After user is authenticated — connect wallet UI (Magic quickstart)
  await connectMagicWallet();

  const provider = new BrowserProvider(rpcProvider);
  const signer = await provider.getSigner();
  const address = (await getMagicWalletAddress()) ?? (await signer.getAddress());

  const ethBalance = await provider.getBalance(address ?? treasury);
  if (ethBalance === BigInt(0)) {
    throw new MagicSettlementError(
      `Add a small amount of ${chain.gasLabel} for gas — your Magic wallet needs it to send ${symbol}`
    );
  }

  const usdt = new Contract(USDT_ARBITRUM, ERC20_ABI, signer);
  const units = parseUnits(amount.toFixed(2), 6);

  const balance: bigint = await usdt.balanceOf(address);
  if (balance < units) {
    throw new MagicSettlementError(
      `Insufficient ${symbol} — need $${amount.toFixed(2)} on ${chain.chainName} in your Magic wallet`
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