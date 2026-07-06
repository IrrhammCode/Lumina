import type { NextRequest } from "next/server";
import type { FamilyMember } from "@/lib/family";
import { isSession, jsonError, jsonOk, parseJsonBody, requireSession } from "@/lib/server/api-utils";
import { signSession, sessionCookieOptions } from "@/lib/server/auth";
import { markOnboarded } from "@/lib/server/user-data";

type Body = { family?: FamilyMember[] };

export async function POST(request: NextRequest) {
  const session = await requireSession(request);
  if (!isSession(session)) return session;

  const body = await parseJsonBody<Body>(request);
  const updated = await markOnboarded(session.sub, body?.family);
  if (!updated) return jsonError("User not found", 404);

  const token = await signSession({
    sub: updated.id,
    email: updated.email,
    walletAddress: updated.walletAddress,
    provider: updated.provider,
    onboarded: true,
    portalToken: updated.portalToken,
  });

  const response = jsonOk({ onboarded: true });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}