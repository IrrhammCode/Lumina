import { portal } from "./copy";
import { getPortalToken, getStoredUser, updatePortalToken } from "./auth";
import { getMemberById } from "./family";
import { api } from "./api-client";
import { buildPortalSearchParams } from "./portal-capability";
import { signPortalCapability } from "./portal-capability-client";
import type { Connector } from "@particle-network/connector-core";
import { getMagicProvider } from "./magic";
import { hasMagicConfig } from "./magic-config";

type SignedPortalCache = {
  memberId: string;
  url: string;
  at: number;
};

let signedCache: SignedPortalCache | null = null;
const CACHE_MS = 30 * 60 * 1000;

export function getFamilyPortalUrl(memberId?: string): string {
  if (signedCache && Date.now() - signedCache.at < CACHE_MS) {
    if (!memberId || signedCache.memberId === memberId) return signedCache.url;
  }

  const token = typeof window !== "undefined" ? getPortalToken() : undefined;
  const params = new URLSearchParams();
  if (memberId) params.set("member", memberId);
  if (token) params.set("token", token);
  const query = params.toString();

  if (typeof window === "undefined") {
    return query ? `/ask?${query}` : "/ask";
  }
  const base = `${window.location.origin}/ask`;
  return query ? `${base}?${query}` : base;
}

export async function buildSignedPortalUrl(input?: {
  memberId?: string;
  connector?: Connector | null;
}): Promise<string> {
  const memberId = input?.memberId ?? "";
  const user = getStoredUser();
  const wallet = user?.walletAddress;

  if (typeof window === "undefined") {
    return getFamilyPortalUrl(memberId || undefined);
  }

  if (wallet) {
    try {
      const magicProvider = hasMagicConfig() ? getMagicProvider() : null;
      const { capability, signature } = await signPortalCapability({
        sponsor: wallet,
        memberId,
        connector: magicProvider ? null : (input?.connector ?? null),
        provider: (magicProvider as import("./portal-capability-client").EthereumProvider | null) ?? undefined,
      });
      const params = buildPortalSearchParams(capability, signature);
      const url = `${window.location.origin}/ask?${params.toString()}`;
      signedCache = { memberId, url, at: Date.now() };
      return url;
    } catch {
      /* fall through to token link */
    }
  }

  return getFamilyPortalUrl(memberId || undefined);
}

export function getPortalShareText(memberId?: string): string {
  const member = memberId ? getMemberById(memberId) : undefined;
  if (member) return portal.shareTextMember(member.name);
  return portal.shareText;
}

export async function copyPortalUrl(
  memberId?: string,
  connector?: Connector | null
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const url = await buildSignedPortalUrl({ memberId, connector });
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

export async function sharePortalUrl(
  memberId?: string,
  connector?: Connector | null
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const url = await buildSignedPortalUrl({ memberId, connector });
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: portal.shareTitle,
        text: getPortalShareText(memberId),
        url,
      });
      return true;
    } catch {
      return copyPortalUrl(memberId, connector);
    }
  }
  return copyPortalUrl(memberId, connector);
}

export async function rotatePortalLink(): Promise<string | null> {
  const result = await api.rotatePortalToken();
  if (!result.ok) return null;
  updatePortalToken(result.data.portalToken);
  signedCache = null;
  return result.data.portalToken;
}

export async function revokePortalLink(): Promise<boolean> {
  const result = await api.revokePortalToken();
  if (!result.ok) return false;
  updatePortalToken("");
  signedCache = null;
  return true;
}