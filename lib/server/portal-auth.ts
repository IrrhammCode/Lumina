import {
  decodePortalCapability,
  isPortalCapabilityFresh,
  verifyPortalCapability,
  type PortalCapability,
} from "@/lib/portal-capability";
import { getUserByPortalToken, getUserByWallet, normalizeWallet } from "./db";

const PORTAL_CHAIN_ID = Number(process.env.PORTAL_SIGN_CHAIN_ID ?? 42161);

export type PortalAuthResult =
  | { ok: true; sponsor: string; memberId: string; capability?: PortalCapability }
  | { ok: false; reason: string };

export async function resolvePortalAuth(input: {
  token?: string | null;
  cap?: string | null;
  sig?: string | null;
  memberId?: string | null;
}): Promise<PortalAuthResult & { user?: Awaited<ReturnType<typeof getUserByWallet>> }> {
  if (input.cap && input.sig) {
    const capability = decodePortalCapability(input.cap);
    if (!capability) return { ok: false, reason: "Invalid portal link" };
    if (!isPortalCapabilityFresh(capability)) {
      return { ok: false, reason: "Portal link expired — ask sponsor for a new link" };
    }

    const valid = await verifyPortalCapability(
      capability,
      input.sig as `0x${string}`,
      PORTAL_CHAIN_ID
    );
    if (!valid) return { ok: false, reason: "Invalid portal signature" };

    const memberId = input.memberId?.trim() || capability.memberId;
    const user = await getUserByWallet(capability.sponsor);
    if (!user) return { ok: false, reason: "Sponsor wallet not found on IPFS" };

    return {
      ok: true,
      sponsor: normalizeWallet(capability.sponsor),
      memberId,
      capability,
      user,
    };
  }

  const token = input.token?.trim();
  if (!token) return { ok: false, reason: "Portal link required" };

  const user = await getUserByPortalToken(token);
  if (!user?.portalToken) return { ok: false, reason: "Invalid or revoked portal link" };

  return {
    ok: true,
    sponsor: normalizeWallet(user.walletAddress),
    memberId: input.memberId?.trim() ?? "",
    user,
  };
}