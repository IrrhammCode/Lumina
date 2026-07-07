"use client";

import { BrowserProvider } from "ethers";
import { getMagicProvider, getMagicWalletAddress } from "./magic";

/** Sign a care payment intent with the Magic embedded wallet (no gas required). */
export async function settleWithMagicWallet(amount: number): Promise<{
  ref: string;
  explorerUrl?: string;
} | null> {
  const rpcProvider = getMagicProvider();
  if (!rpcProvider) return null;

  try {
    const provider = new BrowserProvider(rpcProvider);
    const signer = await provider.getSigner();
    const address = await getMagicWalletAddress();
    const message = [
      "Lumina care payment",
      `Amount: $${amount.toFixed(2)}`,
      `Wallet: ${address ?? "unknown"}`,
      `Time: ${new Date().toISOString()}`,
    ].join("\n");
    const signature = await signer.signMessage(message);
    const ref = `magic:${signature.slice(2, 14)}`;
    return { ref };
  } catch (error) {
    console.error("Magic settlement sign failed:", error);
    return null;
  }
}