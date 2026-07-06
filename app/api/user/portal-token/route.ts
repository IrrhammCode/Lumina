import type { NextRequest } from "next/server";
import { isSession, jsonError, jsonOk, requireSession } from "@/lib/server/api-utils";
import { signSession, sessionCookieOptions } from "@/lib/server/auth";
import { revokePortalToken, rotatePortalToken } from "@/lib/server/user-data";

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const updated = await rotatePortalToken(session.sub);
  if (!updated) return jsonError("User not found", 404);

  const token = await signSession({
    sub: updated.id,
    email: updated.email,
    walletAddress: updated.walletAddress,
    provider: updated.provider,
    onboarded: updated.onboarded,
    portalToken: updated.portalToken,
  });

  const response = jsonOk({ portalToken: updated.portalToken });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}

export async function DELETE(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const updated = await revokePortalToken(session.sub);
  if (!updated) return jsonError("User not found", 404);

  const token = await signSession({
    sub: updated.id,
    email: updated.email,
    walletAddress: updated.walletAddress,
    provider: updated.provider,
    onboarded: updated.onboarded,
    portalToken: "",
  });

  const response = jsonOk({ revoked: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}