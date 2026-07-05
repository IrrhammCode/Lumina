import { portal } from "./copy";
import { getMemberById } from "./family";

export function getFamilyPortalUrl(memberId?: string): string {
  if (typeof window === "undefined") {
    return memberId ? `/ask?member=${memberId}` : "/ask";
  }
  const base = `${window.location.origin}/ask`;
  return memberId ? `${base}?member=${memberId}` : base;
}

export function getPortalShareText(memberId?: string): string {
  const member = memberId ? getMemberById(memberId) : undefined;
  if (member) return portal.shareTextMember(member.name);
  return portal.shareText;
}

export async function copyPortalUrl(memberId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    await navigator.clipboard.writeText(getFamilyPortalUrl(memberId));
    return true;
  } catch {
    return false;
  }
}

export async function sharePortalUrl(memberId?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
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