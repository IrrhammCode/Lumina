// @ts-expect-error - Third-party package missing correct exports for types
import { UniversalAccount, CHAIN_ID } from "@particle-network/universal-account-sdk";
// @ts-expect-error - Third-party package missing correct exports for types
import type { IAssetsResponse } from "@particle-network/universal-account-sdk";

export type { IAssetsResponse };
export { CHAIN_ID };

export function createUniversalAccount(ownerAddress: string): UniversalAccount {
  const ua = new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_APP_ID!,
    ownerAddress,
    tradeConfig: {
      slippageBps: 100, // 1% slippage tolerance
      universalGas: false, // Prioritize PARTI token for gas
    },
  });

  return ua;
}

export async function getSmartAccountInfo(ua: UniversalAccount) {
  try {
    const options = await ua.getSmartAccountOptions();
    return {
      evmSmartAccount: options.smartAccountAddress || "",
      solanaSmartAccount: options.solanaSmartAccountAddress || "",
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
    const assets = await ua.getPrimaryAssets();
    return assets;
  } catch (error) {
    console.error("Failed to get unified balance:", error);
    return null;
  }
}

export async function createTransfer(
  ua: UniversalAccount,
  recipientAddress: string,
  amountInWei: string,
  chainId: number = CHAIN_ID.ARBITRUM_SEPOLIA_TESTNET
) {
  try {
    const transaction = await ua.createUniversalTransaction({
      chainId,
      expectTokens: [],
      transactions: [
        {
          to: recipientAddress,
          value: amountInWei,
          data: "0x",
        },
      ],
    });

    return transaction;
  } catch (error) {
    console.error("Failed to create transfer transaction:", error);
    throw error;
  }
}

export async function sendTransfer(
  ua: UniversalAccount,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transaction: any,
  signature: string
) {
  try {
    const result = await ua.sendTransaction(transaction, signature);
    return result;
  } catch (error) {
    console.error("Failed to send transaction:", error);
    throw error;
  }
}
