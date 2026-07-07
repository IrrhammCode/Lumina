import { hashTypedData, recoverTypedDataAddress, type Hex } from "viem";

export type PortalCapability = {
  sponsor: `0x${string}`;
  memberId: string;
  issuedAt: number;
  nonce: string;
};

export const PORTAL_DOMAIN = {
  name: "Lumina",
  version: "1",
  verifyingContract: "0x0000000000000000000000000000000000000000" as const,
} as const;

export const PORTAL_TYPES = {
  PortalLink: [
    { name: "sponsor", type: "address" },
    { name: "memberId", type: "string" },
    { name: "issuedAt", type: "uint256" },
    { name: "nonce", type: "string" },
  ],
} as const;

export const PORTAL_CAPABILITY_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export function createPortalCapability(
  sponsor: string,
  memberId = ""
): PortalCapability {
  return {
    sponsor: sponsor as `0x${string}`,
    memberId,
    issuedAt: Math.floor(Date.now() / 1000),
    nonce: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function portalCapabilityDomain(chainId: number) {
  return { ...PORTAL_DOMAIN, chainId } as const;
}

export function portalCapabilityDigest(cap: PortalCapability, chainId: number): Hex {
  return hashTypedData({
    domain: portalCapabilityDomain(chainId),
    types: PORTAL_TYPES,
    primaryType: "PortalLink",
    message: {
      sponsor: cap.sponsor,
      memberId: cap.memberId,
      issuedAt: BigInt(cap.issuedAt),
      nonce: cap.nonce,
    },
  });
}

export async function verifyPortalCapability(
  cap: PortalCapability,
  signature: Hex,
  chainId: number
): Promise<boolean> {
  try {
    const recovered = await recoverTypedDataAddress({
      domain: portalCapabilityDomain(chainId),
      types: PORTAL_TYPES,
      primaryType: "PortalLink",
      message: {
        sponsor: cap.sponsor,
        memberId: cap.memberId,
        issuedAt: BigInt(cap.issuedAt),
        nonce: cap.nonce,
      },
      signature,
    });
    return recovered.toLowerCase() === cap.sponsor.toLowerCase();
  } catch {
    return false;
  }
}

export function isPortalCapabilityFresh(cap: PortalCapability): boolean {
  const ageMs = Date.now() - cap.issuedAt * 1000;
  return ageMs >= 0 && ageMs <= PORTAL_CAPABILITY_TTL_MS;
}

export function encodePortalCapability(cap: PortalCapability): string {
  return Buffer.from(JSON.stringify(cap)).toString("base64url");
}

export function decodePortalCapability(encoded: string): PortalCapability | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const cap = JSON.parse(json) as PortalCapability;
    if (!cap.sponsor || typeof cap.issuedAt !== "number") return null;
    return cap;
  } catch {
    return null;
  }
}

export function buildPortalSearchParams(cap: PortalCapability, signature: string): URLSearchParams {
  const params = new URLSearchParams();
  params.set("cap", encodePortalCapability(cap));
  params.set("sig", signature);
  if (cap.memberId) params.set("member", cap.memberId);
  return params;
}