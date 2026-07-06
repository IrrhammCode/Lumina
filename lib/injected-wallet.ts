"use client";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as Window & { ethereum?: EthereumProvider }).ethereum;
  return eth ?? null;
}

export async function connectInjectedWallet(): Promise<string | null> {
  const provider = getInjectedProvider();
  if (!provider) return null;
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  return accounts[0] ?? null;
}

export async function signInjectedMessage(address: string, message: string): Promise<string> {
  const provider = getInjectedProvider();
  if (!provider) throw new Error("No injected wallet found");
  const sig = await provider.request({
    method: "personal_sign",
    params: [message, address],
  });
  return sig as string;
}