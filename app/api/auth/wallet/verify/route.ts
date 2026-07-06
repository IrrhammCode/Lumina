import type { NextRequest } from "next/server";
import { jsonError, parseJsonBody } from "@/lib/server/api-utils";
import { checkRateLimit, consumeWalletChallenge } from "@/lib/server/db";
import { verifySiweSignature } from "@/lib/server/siwe";
import { createAuthResponse, findOrCreateUserByWallet } from "@/lib/server/users";

type Body = { address?: string; message?: string; signature?: string };

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Body>(request);
  const address = body?.address?.trim();
  const message = body?.message?.trim();
  const signature = body?.signature?.trim();

  if (!address || !message || !signature) {
    return jsonError("address, message, and signature are required");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return jsonError("Valid wallet address is required");
  }

  const limit = await checkRateLimit(`wallet_verify:${address.toLowerCase()}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return jsonError(`Too many attempts. Retry in ${limit.retryAfterSec}s`, 429);
  }

  const challenge = await consumeWalletChallenge(address);
  if (!challenge || challenge.message !== message) {
    return jsonError("Invalid or expired challenge", 401);
  }

  const valid = await verifySiweSignature(address, message, signature);
  if (!valid) {
    return jsonError("Signature verification failed", 401);
  }

  const user = await findOrCreateUserByWallet(address);
  return createAuthResponse(user);
}