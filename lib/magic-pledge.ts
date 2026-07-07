"use client";

import { BrowserProvider } from "ethers";
import { getMagicProvider, getMagicWalletAddress } from "./magic";

export async function signCarePledge(familyNames: string[]): Promise<string | null> {
  const rpcProvider = getMagicProvider();
  if (!rpcProvider) return null;

  try {
    const provider = new BrowserProvider(rpcProvider);
    const signer = await provider.getSigner();
    const address = await getMagicWalletAddress();
    const names = familyNames.length > 0 ? familyNames.join(", ") : "my family back home";
    const message = [
      "Lumina Care Pledge",
      `I commit to supporting: ${names}`,
      `Wallet: ${address ?? "embedded"}`,
      `Signed: ${new Date().toISOString()}`,
    ].join("\n");
    return await signer.signMessage(message);
  } catch {
    return null;
  }
}

const PLEDGE_KEY = "lumina:care-pledge";

export function getStoredPledgeRef(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLEDGE_KEY);
}

export function storePledgeRef(signature: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLEDGE_KEY, `magic:${signature.slice(2, 14)}`);
}