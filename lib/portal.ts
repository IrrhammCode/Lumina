import { portal } from "./copy";
import { getPortalToken, updatePortalToken } from "./auth";
import { getMemberById } from "./family";
import { api } from "./api-client";

export function getFamilyPortalUrl(memberId?: string): string {
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

export function getPortalShareText(memberId?: string): string {
  const member = memberId ? getMemberById(memberId) : undefined;
  if (member) return portal.shareTextMember(member.name);
  return portal.shareText;
}

export async function copyPortalUrl(memberId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getPortalToken()) return false;
  try {
    await navigator.clipboard.writeText(getFamilyPortalUrl(memberId));
    return true;
  } catch {
    return false;
  }
}

export async function sharePortalUrl(memberId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!getPortalToken()) return false;
  const url = getFamilyPortalUrl(memberId);
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: portal.shareTitle,
        text: getPortalShareText(memberId),
        url,
      });
      return true;
    } catch {
      return false;
    }
  }
  return copyPortalUrl(memberId);
}

export async function rotatePortalLink(): Promise<string | null> {
  const result = await api.rotatePortalToken();
  if (!result.ok) return null;
  updatePortalToken(result.data.portalToken);
  return result.data.portalToken;
}

export async function revokePortalLink(): Promise<boolean> {
  const result = await api.revokePortalToken();
  if (!result.ok) return false;
  updatePortalToken("");
  return true;
}