import {
  UniversalAccount,
  CHAIN_ID,
  type IAssetsResponse,
  type ITransaction,
  type ISmartAccountOptions,
} from "./ua-sdk";
import type { Connector } from "@particle-network/connector-core";
import { getParticleCredentials } from "./particle-config";
import { buildEIP7702Authorizations } from "./eip7702";
import { getWalletClientFromConnector, signUaRootHash } from "./wallet-client";

export type { IAssetsResponse };
export { CHAIN_ID };

const USDT_ARBITRUM = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";

export function createUniversalAccount(ownerAddress: string): UniversalAccount {
  const creds = getParticleCredentials();
  return new UniversalAccount({
    projectId: creds.projectId,
    projectClientKey: creds.projectClientKey,
    projectAppUuid: creds.projectAppUuid,
    smartAccountOptions: {
      ownerAddress,
      useEIP7702: true,
    },
    tradeConfig: {
      slippageBps: 100,
      universalGas: true,
    },
  });
}

export async function getSmartAccountInfo(ua: UniversalAccount) {
  try {
    const options: ISmartAccountOptions = await ua.getSmartAccountOptions();
    return {
      ownerAddress: options.ownerAddress,
      evmSmartAccount: options.smartAccountAddress || options.ownerAddress,
      solanaSmartAccount: options.solanaSmartAccountAddress || "",
      useEIP7702: options.useEIP7702 ?? true,
      eip7702Delegated: options.options?.eip7702Delegated ?? false,
    };
  } catch (error) {
    console.error("Failed to get smart account options:", error);
    return null;
  }
}

export async function getUnifiedBalance(
  ua: UniversalAccount
): Promise<IAssetsResponse | null> {
  try {
    return await ua.getPrimaryAssets();
  } catch (error) {
    console.error("Failed to get unified balance:", error);
    return null;
  }
}

/** Cross-chain USDT transfer on Arbitrum — sources liquidity from any chain via UA */
export async function createCrossChainTransfer(
  ua: UniversalAccount,
  recipientAddress: string,
  amountUsd: string
) {
  return ua.createTransferTransaction({
    token: {
      chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE,
      address: USDT_ARBITRUM,
    },
    amount: amountUsd,
    receiver: recipientAddress,
  });
}

export async function signAndSendUaTransaction(
  ua: UniversalAccount,
  connector: Connector,
  transaction: ITransaction
) {
  const walletClient = await getWalletClientFromConnector(connector);
  const signature = await signUaRootHash(connector, transaction.rootHash);
  const authorizations = await buildEIP7702Authorizations(transaction, walletClient);
  return ua.sendTransaction(transaction, signature, authorizations);
}

export async function sendCrossChainCarePayment(
  ua: UniversalAccount,
  connector: Connector,
  recipientAddress: string,
  amountUsd: number
) {
  const amount = amountUsd.toFixed(2);
  const transaction = await createCrossChainTransfer(ua, recipientAddress, amount);
  return signAndSendUaTransaction(ua, connector, transaction);
}