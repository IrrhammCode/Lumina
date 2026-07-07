"use client";

import { Contract, formatUnits } from "ethers";
import { ERC20_ABI, getArbitrumRpcUrl, USDT_ARBITRUM } from "./onchain";
import { getMagicProvider, getMagicWalletAddress } from "./magic";

export type MagicWalletBalances = {
  usdtUsd: number;
  hasGas: boolean;
};

export async function fetchMagicWalletBalances(address?: string | null): Promise<MagicWalletBalances | null> {
  const rpc = getMagicProvider();
  if (!rpc) return null;

  const wallet = address ?? (await getMagicWalletAddress());
  if (!wallet) return null;

  try {
    const { BrowserProvider } = await import("ethers");
    const provider = new BrowserProvider(rpc);
    const usdt = new Contract(USDT_ARBITRUM, ERC20_ABI, provider);
    const [rawUsdt, ethWei] = await Promise.all([
      usdt.balanceOf(wallet) as Promise<bigint>,
      provider.getBalance(wallet),
    ]);

    return {
      usdtUsd: parseFloat(formatUnits(rawUsdt, 6)),
      hasGas: ethWei > BigInt(0),
    };
  } catch {
    return null;
  }
}