import type { NextRequest } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/server/api-utils";
import { createAuthResponse, findOrCreateUserByWallet } from "@/lib/server/users";

type Body = { address?: string };

/** Dev-only shortcut — production must use SIWE challenge + verify */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return jsonError("Use /api/auth/wallet/challenge and /api/auth/wallet/verify (SIWE).", 400);
  }

  const body = await parseJsonBody<Body>(request);
  const address = body?.address?.trim();
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return jsonError("Valid wallet address is required");
  }

  const user = await findOrCreateUserByWallet(address);
  return createAuthResponse(user);
}