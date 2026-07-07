import type { NextRequest } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/server/api-utils";
import { verifyMagicDidToken } from "@/lib/server/magic-admin";
import { createAuthResponse, findOrCreateUserByMagic } from "@/lib/server/users";

type Body = { didToken?: string };

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Body>(request);
  const didToken = body?.didToken?.trim();
  if (!didToken) return jsonError("Magic DID token is required");

  const verified = await verifyMagicDidToken(didToken);
  if (!verified) {
    return jsonError("Invalid or expired Magic session", 401);
  }

  const user = await findOrCreateUserByMagic({
    walletAddress: verified.publicAddress,
    email: verified.email,
    oauthProvider: verified.oauthProvider,
  });

  return createAuthResponse(user);
}