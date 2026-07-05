import {
  createWalletClient,
  custom,
  type Chain,
  type EIP1193Provider,
  type WalletClient,
} from "viem";
import type { Connector } from "@particle-network/connector-core";


type SignableProvider = EIP1193Provider & {
  signMessage?: (args: { message: string }) => Promise<string | { signature: string }>;
};

export async function getWalletClientFromConnector(
  connector: Connector
): Promise<WalletClient> {
  const provider = await connector.getProvider();
  const accounts = await connector.getAccounts();
  const chainId = await connector.getChainId();

  if (!accounts[0]) throw new Error("No connected wallet account");

  return createWalletClient({
    account: accounts[0] as `0x${string}`,
    chain: { id: chainId } as Chain,
    transport: custom(provider as EIP1193Provider),
  });
}

export async function signUaRootHash(
  connector: Connector,
  rootHash: string
): Promise<string> {
  const provider = (await connector.getProvider()) as SignableProvider;
  const accounts = await connector.getAccounts();
  const account = accounts[0];
  if (!account) throw new Error("No connected wallet account");

  if (typeof provider.signMessage === "function") {
    const result = await provider.signMessage({ message: rootHash });
    if (typeof result === "string") return result;
    if (result?.signature) return result.signature;
  }

  if (typeof provider.request === "function") {
    const sig = await provider.request({
      method: "personal_sign",
      params: [rootHash as `0x${string}`, account as `0x${string}`],
    });
    return sig as string;
  }

  throw new Error("Wallet does not support message signing");
}