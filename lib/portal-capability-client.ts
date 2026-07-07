"use client";

import type { Connector } from "@particle-network/connector-core";
import {
  createPortalCapability,
  PORTAL_DOMAIN,
  PORTAL_TYPES,
  type PortalCapability,
} from "./portal-capability";

const DEFAULT_CHAIN_ID = 42161;

export type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function typedDataPayload(cap: PortalCapability, chainId: number) {
  return {
    domain: { ...PORTAL_DOMAIN, chainId },
    types: PORTAL_TYPES,
    primaryType: "PortalLink" as const,
    message: {
      sponsor: cap.sponsor,
      memberId: cap.memberId,
      issuedAt: cap.issuedAt,
      nonce: cap.nonce,
    },
  };
}

async function signTypedData(
  provider: EthereumProvider,
  address: string,
  cap: PortalCapability,
  chainId: number
): Promise<string> {
  const payload = typedDataPayload(cap, chainId);
  return (await provider.request({
    method: "eth_signTypedData_v4",
    params: [address, JSON.stringify(payload)],
  })) as string;
}

export async function signPortalCapability(input: {
  sponsor: string;
  memberId?: string;
  connector?: Connector | null;
  provider?: EthereumProvider | null;
  chainId?: number;
}): Promise<{ capability: PortalCapability; signature: string }> {
  const capability = createPortalCapability(input.sponsor, input.memberId ?? "");
  const chainId = input.chainId ?? DEFAULT_CHAIN_ID;

  if (input.connector) {
    const raw = await input.connector.getProvider();
    const eth = raw as EthereumProvider | null;
    if (!eth?.request) throw new Error("Wallet provider unavailable");
    const signature = await signTypedData(eth, input.sponsor, capability, chainId);
    return { capability, signature };
  }

  if (input.provider?.request) {
    const signature = await signTypedData(input.provider, input.sponsor, capability, chainId);
    return { capability, signature };
  }

  throw new Error("Connect wallet to sign portal link");
}