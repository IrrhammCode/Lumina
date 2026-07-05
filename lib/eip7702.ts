import { Signature } from "ethers";
import { signAuthorization } from "viem/actions";
import type { WalletClient } from "viem";
import type { EIP7702Authorization, ITransaction, IUserOpWithChain } from "./ua-sdk";

type UserOpWithAuth = IUserOpWithChain & {
  eip7702Auth?: { address: string; chainId: number; nonce: number };
  eip7702Delegated?: boolean;
};

export async function buildEIP7702Authorizations(
  transaction: ITransaction,
  walletClient: WalletClient
): Promise<EIP7702Authorization[]> {
  const authorizations: EIP7702Authorization[] = [];
  const nonceMap = new Map<number, string>();
  const userOps = (transaction.userOps ?? []) as UserOpWithAuth[];

  for (const userOp of userOps) {
    if (!userOp.eip7702Auth || userOp.eip7702Delegated) continue;

    let serialized = nonceMap.get(userOp.eip7702Auth.nonce);
    if (!serialized) {
      const account = walletClient.account;
      if (!account) throw new Error("Wallet account not available");

      const signed = await signAuthorization(walletClient, {
        account,
        contractAddress: userOp.eip7702Auth.address as `0x${string}`,
        chainId: userOp.eip7702Auth.chainId,
        nonce: userOp.eip7702Auth.nonce,
      });

      serialized = Signature.from({
        r: signed.r,
        s: signed.s,
        yParity: (signed.yParity ?? 0) as 0 | 1,
      }).serialized;
      nonceMap.set(userOp.eip7702Auth.nonce, serialized);
    }

    authorizations.push({
      userOpHash: userOp.userOpHash,
      signature: serialized,
    });
  }

  return authorizations;
}